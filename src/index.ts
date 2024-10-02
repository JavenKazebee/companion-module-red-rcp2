import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from "@companion-module/base";
import { configFields, ModuleConfig } from "./config.js";
import updateActions from "./actions.js";
import updateVariableDefinitions from "./variables.js";
import { upgradeScripts } from "./upgrade.js"; 
import { Camera, List, Int, Str } from "red-rcp2";
import DropdownOptions from "./options.js";

export default class ModuleInstance extends InstanceBase<ModuleConfig> {
    config!: ModuleConfig;
    camera: Camera | null = null;
    options: DropdownOptions = new DropdownOptions();
    reconnectTimer: NodeJS.Timeout | null = null;

    constructor(internal: unknown) {
        super(internal);
    }

    async init(config: ModuleConfig): Promise<void> { 
        this.config = config;

        // If connection fails, periodically attempt to reconnect
        if(!await this.attemptConnection()) {
            this.reconnectUntilConnected();
        }

        // Initialize actions and variables
        this.updateActions();
        this.updateVariableDefinitions();
    }

    async destroy(): Promise<void> {
        this.camera = null;
        clearTimeout(this.reconnectTimer as NodeJS.Timeout);
    }

    async configUpdated(config: ModuleConfig): Promise<void> {
        // If the IP has changed, clear the camera, update the ip, and re-connect
        if(this.config.ip != config.ip) {
            this.camera = null;
            this.config.ip = config.ip;
            this.attemptConnection();
        }

        // If the reconnect rate has changed, clear the current reconnection attempt and start a new one
        if(this.config.reconnectRate != config.reconnectRate) {
            this.config.reconnectRate = config.reconnectRate;
            if(this.reconnectTimer) {
                clearTimeout(this.reconnectTimer as NodeJS.Timeout);
                this.reconnectTimer = null;
            }
            this.reconnectUntilConnected();
        }

        // Update the config
        this.config = config;
	}

    getConfigFields(): SomeCompanionConfigField[] {
        return configFields;
    }

    updateActions(): void {
        updateActions(this);
    }

    updateVariableDefinitions(): void {
        updateVariableDefinitions(this);
    }

    async attemptConnection(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            this.log('info', 'Attempting connection to ' + this.config.ip);
            // If the ip field is empty, return
            if(this.config.ip == "") {
                reject();
            }

            this.updateStatus(InstanceStatus.Connecting);
            try {
                this.log('info', 'Trying to connect...');
                this.camera = await new Camera('Companion', this.config.ip).connect();
                this.log('info', 'Camera found!');
                this.camera.onMessage((data) => {
                    this.messageHandler(data);
                });

                this.camera.onClose(() => {
                    this.updateStatus(InstanceStatus.Disconnected);
                    this.camera = null;
                    this.reconnectUntilConnected();
                });

                this.subscribeActions();
                this.initalizeVariables();
                this.updateStatus(InstanceStatus.Ok);
                
                resolve(true);
            } catch (e: any) {
                this.log('info', 'Connection failed: ' + e.message);
                if(e.code == "EHOSTDOWN") {
                    this.updateStatus(InstanceStatus.Disconnected);
                } else {
                    this.updateStatus(InstanceStatus.ConnectionFailure);
                    this.log('error', 'Camera connection failed');
                }
                resolve(false);
            }
        });
        
    }
    messageHandler(data: any) {
        switch(data.type) {
            case "rcp_cur_list":
                this.handleList(data);
                break;
            case "rcp_cur_int":
                this.handleCurInt(data);
                break;
            case "rcp_cur_str":
                this.handleCurStr(data);
                break;
        }
    }
    
    handleList(data: List) {
        // Update dropdown options
        switch(data.id) {
            case "ISO":
                this.options.iso = [];
                data.list.data.forEach((item) => {
                    this.options.iso.push({ id: item.num.toString(), label: item.num.toString() });
                });
                updateActions(this);
                break;
            case "APERTURE":
                this.options.iris = [];
                data.list.data.forEach((item) => {
                    let num = item.num / 10;
                    this.options.iris.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "EXPOSURE_ANGLE":
                this.options.shutter = [];
                data.list.data.forEach((item) => {
                    let num = item.num / 1000;
                    this.options.shutter.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "SENSOR_FRAME_RATE":
                this.options.sensorFrameRate = [];
                data.list.data.forEach((item) => {
                    let num = item.num / 1000;
                    this.options.sensorFrameRate.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "RECORD_FORMAT":
                this.options.sensorFormat = [];
                data.list.data.forEach((item) => {
                    this.options.sensorFormat.push({ id: item.num, label: item.str });
                });
                updateActions(this);
                break;
        }
    }

    handleCurInt(data: Int) {
        switch(data.id) {
            case "ISO":
                this.setVariableValues({ 'iso': data.cur.val });
                break;
            case "APERTURE":
                this.setVariableValues({ 'iris': data.cur.val / data.edit_info.divider });
                break;
            case "COLOR_TEMPERATURE":
                this.setVariableValues({ 'white_balance': data.cur.val });
                break;
            case "EXPOSURE_ANGLE":
                this.setVariableValues({ 'shutter': data.cur.val / data.edit_info.divider });
                break;
            case "POWER_IN_ACTIVE":
                let name = data.cur.val == 1 ? 'Battery' : 'DC';
                this.setVariableValues({ 'active_power_source': name });
        }
    }

    handleCurStr(data: Str) {
        switch(data.id) {
            case "RECORD_FORMAT":
                this.setVariableValues({ 'sensor_format': data.display.str });
                break;
            case "SENSOR_FRAME_RATE":
                this.setVariableValues({ 'sensor_frame_rate': parseFloat(data.display.abbr)});
                break;
        }
    }

    initalizeVariables() {
        this.camera?.get("ISO");
        this.camera?.get("APERTURE"); // Iris
        this.camera?.get("COLOR_TEMPERATURE"); // White balance
        this.camera?.get("EXPOSURE_ANGLE"); // Shutter angle
        this.camera?.get("SENSOR_FRAME_RATE");
        this.camera?.get("RECORD_FORMAT"); // Sensor format
        this.camera?.get("POWER_IN_ACTIVE"); // Active power source
    }

    async reconnectUntilConnected() {
        this.log('info', 'Setting up reconnect timer.')
        // Create interval
        this.reconnectTimer = setInterval(async () => {
            // Attempt to reconnect
            if(await this.attemptConnection()) {
                this.log('info', 'Reconnection successful.');
                // If successful, clear interval
                clearInterval(this.reconnectTimer as NodeJS.Timeout);
                this.reconnectTimer = null;
            }
        }, 1000 * this.config.reconnectRate);
    }
}

runEntrypoint(ModuleInstance, upgradeScripts);