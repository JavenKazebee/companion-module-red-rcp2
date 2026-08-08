import { InstanceBase, InstanceStatus, SomeCompanionConfigField, DropdownChoice } from '@companion-module/base'
import { configFields, ModuleConfig, ModuleSchema } from './config.js'
import updateActions from './actions.js'
import updateVariableDefinitions from './variables.js'
import { Camera, Types } from 'red-rcp2'
import DropdownOptions from './options.js'
import { PARAMETERS, PARAMETERS_BY_ID } from './parameters.js'

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	camera: Camera | null = null
	options: DropdownOptions = new DropdownOptions()
	reconnectTimer: NodeJS.Timeout | null = null

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		// If connection fails, periodically attempt to reconnect
		if (!(await this.attemptConnection())) {
			this.reconnectUntilConnected()
		}

		// Initialize actions and variables
		this.updateActions()
		this.updateVariableDefinitions()
	}

	async destroy(): Promise<void> {
		this.teardownCamera()
		clearTimeout(this.reconnectTimer as NodeJS.Timeout)
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		// If the IP has changed, clear the camera, update the ip, and re-connect
		if (this.config.ip != config.ip) {
			this.teardownCamera()
			this.config.ip = config.ip
			this.attemptConnection()
		}

		// If the reconnect rate has changed, clear the current reconnection attempt and start a new one
		if (this.config.reconnectRate != config.reconnectRate) {
			this.config.reconnectRate = config.reconnectRate
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer as NodeJS.Timeout)
				this.reconnectTimer = null
			}
			this.reconnectUntilConnected()
		}

		// If the camera model has changed, regenerate actions/variables and re-fetch under the new scope
		if (this.config.cameraModel != config.cameraModel) {
			this.config.cameraModel = config.cameraModel
			this.updateActions()
			this.updateVariableDefinitions()
			if (this.camera) {
				this.initalizeVariables()
			}
		}

		// Update the config
		this.config = config
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return configFields
	}

	updateActions(): void {
		updateActions(this)
	}

	updateVariableDefinitions(): void {
		updateVariableDefinitions(this)
	}

	async attemptConnection(): Promise<boolean> {
		return new Promise(async (resolve) => {
			this.log('info', 'Attempting connection to ' + this.config.ip)
			// If the ip field is empty, return
			if (this.config.ip == '') {
				this.log('info', 'IP field empty.')
				resolve(false)
				return
			}

			this.updateStatus(InstanceStatus.Connecting)
			try {
				this.log('info', 'Trying to connect...')
				this.camera = await new Camera('Companion', this.config.ip).connect()
				this.log('info', 'Camera found!')

				this.camera.on('message', (data) => {
					this.messageHandler(data)
				})

				this.camera.on('close', () => {
					this.updateStatus(InstanceStatus.Disconnected)
					this.camera = null
					this.reconnectUntilConnected()
				})

				this.subscribeActions()
				this.initalizeVariables()
				this.camera.getParameters()
				this.updateStatus(InstanceStatus.Ok)

				resolve(true)
			} catch (e: any) {
				this.log('info', 'Connection failed: ' + e.message)
				if (e.code == 'EHOSTDOWN') {
					this.updateStatus(InstanceStatus.Disconnected)
				} else {
					this.updateStatus(InstanceStatus.ConnectionFailure)
					this.log('error', 'Camera connection failed')
				}
				resolve(false)
			}
		})
	}

	private teardownCamera(): void {
		if (this.camera) {
			this.camera.removeAllListeners()
			this.camera.disconnect()
		}
		this.camera = null
	}

	cameraGet(...args: Parameters<Camera['get']>): void {
		if (!this.camera) return
		try {
			this.camera.get(...args)
		} catch (e: any) {
			this.log('debug', `Camera get failed (${args[0]}): ${e.message}`)
		}
	}

	cameraGetList(...args: Parameters<Camera['getList']>): void {
		if (!this.camera) return
		try {
			this.camera.getList(...args)
		} catch (e: any) {
			this.log('debug', `Camera getList failed (${args[0]}): ${e.message}`)
		}
	}

	cameraSet(...args: Parameters<Camera['set']>): void {
		if (!this.camera) return
		try {
			this.camera.set(...args)
		} catch (e: any) {
			this.log('debug', `Camera set failed (${args[0]}): ${e.message}`)
		}
	}

	messageHandler(data: any) {
		switch (data.type) {
			case 'rcp_cur_list':
				this.handleList(data)
				break
			case 'rcp_cur_int':
				this.handleCurInt(data)
				break
			case 'rcp_cur_str':
				this.handleCurStr(data)
				break
			case 'rcp_cur_cdl':
				this.handleCurCDL(data)
				break
			case 'rcp_cur_parameters':
				this.handleCurParameters(data)
				break
		}
	}

	handleCurParameters(data: Types.CurParameters) {
		const unknown = data.parameters.filter((id) => !PARAMETERS_BY_ID.has(id))
		if (unknown.length > 0) {
			this.log(
				'debug',
				`Camera reports ${unknown.length} parameter(s) not covered by tracked variables: ${unknown.join(', ')}`,
			)
		}
	}

	handleList(data: Types.CurList) {
		const choices: DropdownChoice[] = data.list.data.map((item) => ({
			id: data.send === 'str' ? item.str! : (item.num ?? item.str!),
			label: item.str ?? String(item.num),
		}))
		this.options.lists.set(data.id, choices)
		updateActions(this)
	}

	handleCurInt(data: Types.CurInt) {
		const def = PARAMETERS_BY_ID.get(data.id)
		if (def) this.setVariableValues({ [def.variableId]: data.cur.val })
	}

	handleCurStr(data: Types.CurStr) {
		const def = PARAMETERS_BY_ID.get(data.id)
		if (def) this.setVariableValues({ [def.variableId]: data.display.str })
	}

	handleCurCDL(data: Types.CurCdl) {
		this.setVariableValues({
			cdl_power_r: data.power.r,
			cdl_power_g: data.power.g,
			cdl_power_b: data.power.b,

			cdl_slope_r: data.slope.r,
			cdl_slope_g: data.slope.g,
			cdl_slope_b: data.slope.b,

			cdl_offset_r: data.offset.r,
			cdl_offset_g: data.offset.g,
			cdl_offset_b: data.offset.b,

			cdl_saturation: data.saturation,
		})
	}

	initalizeVariables() {
		for (const def of PARAMETERS) {
			if (def.kind === 'action') continue
			if (!def.cameras.includes(this.config.cameraModel)) continue
			this.cameraGet(def.id)
		}
	}

	async reconnectUntilConnected() {
		this.log('info', 'Setting up reconnect timer.')
		// Create interval
		this.reconnectTimer = setInterval(async () => {
			// Attempt to reconnect
			if (await this.attemptConnection()) {
				this.log('info', 'Reconnection successful.')
				// If successful, clear interval
				clearInterval(this.reconnectTimer as NodeJS.Timeout)
				this.reconnectTimer = null
			}
		}, 1000 * this.config.reconnectRate)
	}
}

export { UpgradeScripts } from './upgrade.js'
