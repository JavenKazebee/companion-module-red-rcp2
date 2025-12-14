import ModuleInstance from './index.js'

export default function updateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		iso: {
			name: 'ISO',
			options: [
				{
					id: 'selector',
					type: 'dropdown',
					label: 'Action',
					default: 'increment',
					choices: self.options.incrementDecrementSet,
				},
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
					isVisibleExpression: "$(options:selector) == 'set'",
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'ISO',
					default: self.options.iso[0]?.id,
					choices: self.options.iso,
					isVisibleExpression: "$(options:selector) == 'set' && !$(options:useVariable)",
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'ISO (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: "$(options:selector) == 'set' && $(options:useVariable)",
				},
			],
			callback: async (event) => {
				const currentIndex = self.options.iso.findIndex((item) => item.id == self.getVariableValue('iso'))
				for (let i = 0; i < self.options.iso.length; i++) {}
				// To increment, we have to not go over the last item
				if (event.options.selector === 'increment' && currentIndex < self.options.iso.length - 1) {
					self.camera?.set('ISO', self.options.iso[currentIndex + 1].id as number)
				} else if (event.options.selector === 'decrement' && currentIndex > 0) {
					self.camera?.set('ISO', self.options.iso[currentIndex - 1].id as number)
				} else if (event.options.selector === 'set') {
					const value = event.options.useVariable ? event.options.valVariable : event.options.val
					self.camera?.set('ISO', value as number)
				}
			},
			subscribe: () => {
				self.camera?.getList('ISO')
			},
		},
		aperture: {
			name: 'Aperture',
			options: [
				{
					id: 'selector',
					type: 'dropdown',
					label: 'Action',
					default: 'increment',
					choices: self.options.incrementDecrementSet,
				},
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
					isVisibleExpression: "$(options:selector) == 'set'",
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Aperture',
					default: self.options.aperture[0]?.id,
					choices: self.options.aperture,
					isVisibleExpression: "$(options:selector) == 'set' && !$(options:useVariable)",
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Aperture (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: "$(options:selector) == 'set' && $(options:useVariable)",
				},
			],
			callback: async (event) => {
				const currentIndex = self.options.aperture.findIndex((item) => item.label == self.getVariableValue('aperture'))
				// To increment, we have to not go over the last item
				if (event.options.selector === 'increment' && currentIndex < self.options.aperture.length - 1) {
					self.camera?.set('APERTURE', self.options.aperture[currentIndex + 1].id as number)
				} else if (event.options.selector === 'decrement' && currentIndex > 0) {
					self.camera?.set('APERTURE', self.options.aperture[currentIndex - 1].id as number)
				} else if (event.options.selector === 'set') {
					const value = event.options.useVariable ? event.options.valVariable : event.options.val
					self.camera?.set('APERTURE', value as number)
				}
			},
			subscribe: () => {
				self.camera?.getList('APERTURE')
			},
		},
		white_balance: {
			name: 'White Balance',
			options: [
				{
					id: 'selector',
					type: 'dropdown',
					label: 'Action',
					default: 'increment',
					choices: self.options.incrementDecrementSet,
				},
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
					isVisibleExpression: "$(options:selector) == 'set'",
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'White Balance',
					default: self.options.colorTemperature[0]?.id,
					choices: self.options.colorTemperature,
					isVisibleExpression: "$(options:selector) == 'set' && !$(options:useVariable)",
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'White Balance (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: "$(options:selector) == 'set' && $(options:useVariable)",
				},
			],
			callback: async (event) => {
				const currentIndex = self.options.colorTemperature.findIndex(
					(item) => item.id == self.getVariableValue('white_balance'),
				)
				self.log('info', 'Current index: ' + currentIndex)
				self.log(
					'info',
					'ID: ' + self.options.colorTemperature[0].id + ' Label: ' + self.options.colorTemperature[0].label,
				)
				// To increment, we have to not go over the last item
				if (event.options.selector === 'increment' && currentIndex < self.options.colorTemperature.length - 1) {
					self.camera?.set('COLOR_TEMPERATURE', self.options.colorTemperature[currentIndex + 1].id as number)
				} else if (event.options.selector === 'decrement' && currentIndex > 0) {
					self.camera?.set('COLOR_TEMPERATURE', self.options.colorTemperature[currentIndex - 1].id as number)
				} else if (event.options.selector === 'set') {
					const value = event.options.useVariable ? event.options.valVariable : event.options.val
					self.camera?.set('COLOR_TEMPERATURE', value as number)
				}
			},
			subscribe: () => {
				self.camera?.getList('COLOR_TEMPERATURE')
			},
		},
		shutter: {
			name: 'Shutter',
			options: [
				{
					id: 'selector',
					type: 'dropdown',
					label: 'Action',
					default: 'increment',
					choices: self.options.incrementDecrementSet,
				},
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
					isVisibleExpression: "$(options:selector) == 'set'",
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Shutter',
					default: self.options.shutter[0]?.id,
					choices: self.options.shutter,
					isVisibleExpression: "$(options:selector) == 'set' && !$(options:useVariable)",
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Shutter (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: "$(options:selector) == 'set' && $(options:useVariable)",
				},
			],
			callback: async (event) => {
				const currentIndex = self.options.shutter.findIndex((item) => item.label == self.getVariableValue('shutter'))
				self.log('info', 'Current index: ' + currentIndex)
				self.log('info', 'ID: ' + self.options.shutter[0].id + ' Label: ' + self.options.shutter[0].label)
				// To increment, we have to not go over the last item
				if (event.options.selector === 'increment' && currentIndex < self.options.shutter.length - 1) {
					self.camera?.set('EXPOSURE_ANGLE', self.options.shutter[currentIndex + 1].id as number)
				} else if (event.options.selector === 'decrement' && currentIndex > 0) {
					self.camera?.set('EXPOSURE_ANGLE', self.options.shutter[currentIndex - 1].id as number)
				} else if (event.options.selector === 'set') {
					const value = event.options.useVariable ? event.options.valVariable : event.options.val
					self.camera?.set('EXPOSURE_ANGLE', value as number)
				}
			},
			subscribe: () => {
				self.camera?.getList('EXPOSURE_ANGLE')
			},
		},
		sensor_frame_rate: {
			name: 'Sensor Frame Rate',
			options: [
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Frame Rate',
					default: self.options.sensorFrameRate[0]?.id,
					minChoicesForSearch: 3,
					choices: self.options.sensorFrameRate,
					isVisibleExpression: '!$(options:useVariable)',
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Frame Rate (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: '$(options:useVariable)',
				},
			],
			callback: async (event) => {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.camera?.set('SENSOR_FRAME_RATE', value?.toString())
			},
			subscribe: () => {
				self.camera?.getList('SENSOR_FRAME_RATE')
			},
		},
		sensor_format: {
			name: 'Sensor Format',
			options: [
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Sensor Format',
					default: self.options.sensorFormat[0]?.id,
					minChoicesForSearch: 3,
					choices: self.options.sensorFormat,
					isVisibleExpression: '!$(options:useVariable)',
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Sensor Format (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: '$(options:useVariable)',
				},
			],
			callback: async (event) => {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.camera?.set('RECORD_FORMAT', value?.toString())
			},
			subscribe: () => {
				self.camera?.getList('RECORD_FORMAT')
			},
		},
		camera_lut: {
			name: 'Camera LUT',
			options: [
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Camera LUT',
					default: self.options.cameraLuts[0]?.id,
					minChoicesForSearch: 3,
					choices: self.options.cameraLuts,
					isVisibleExpression: '!$(options:useVariable)',
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Camera LUT (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: '$(options:useVariable)',
				},
			],
			callback: async (event) => {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.camera?.set('CAMERA_LUT', value?.toString())
			},
			subscribe: () => {
				self.camera?.getList('CAMERA_LUT')
			},
		},
		camera_lut_enable: {
			name: 'Camera LUT Enable',
			options: [
				{
					id: 'val',
					type: 'dropdown',
					label: 'Action',
					default: 'toggle',
					choices: self.options.enableDisableToggle,
				},
			],
			callback: async (event) => {
				switch (event.options.val) {
					case 'enable':
						self.camera?.set('CAMERA_LUT_ENABLE', 1)
						break
					case 'disable':
						self.camera?.set('CAMERA_LUT_ENABLE', 0)
						break
					case 'toggle':
						if (self.getVariableValue('camera_lut_enable') == 'On') {
							self.camera?.set('CAMERA_LUT_ENABLE', 0)
						} else {
							self.camera?.set('CAMERA_LUT_ENABLE', 1)
						}
						break
				}
			},
		},
		media_format: {
			name: 'Media Format',
			options: [], // Options are required even if empty for some reason
			callback: async (_) => {
				self.camera?.set('MEDIA_FORMAT', 3)
			},
		},
		media_format_confirm: {
			name: 'Media Format Confirm',
			options: [], // Options are required even if empty for some reason
			callback: async (_) => {
				self.camera?.set('MEDIA_FORMAT', 2)
			},
		},
		media_format_confirm_footage: {
			name: 'Media Format Confirm Footage',
			options: [], // Options are required even if empty for some reason
			callback: async (_) => {
				self.camera?.set('MEDIA_FORMAT', 4)
			},
		},
		preset_apply: {
			name: 'Preset Apply',
			options: [
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Preset',
					default: self.options.presets[0]?.id,
					minChoicesForSearch: 3,
					choices: self.options.presets,
					isVisibleExpression: '!$(options:useVariable)',
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Preset (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: '$(options:useVariable)',
				},
			],
			callback: async (event) => {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.camera?.set('CAMERA_PRESET_APPLY', value?.toString())
			},
			subscribe: () => {
				self.camera?.getList('CAMERA_PRESET_LIST')
			},
		},

		color_space: {
			name: 'Color Space',
			options: [
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Color Space',
					default: self.options.colorSpace[0]?.id,
					minChoicesForSearch: 3,
					choices: self.options.colorSpace,
					isVisibleExpression: '!$(options:useVariable)',
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Color Space (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: '$(options:useVariable)',
				},
			],
			callback: async (event) => {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.camera?.set('COLOR_SPACE', value?.toString())
			},
			subscribe: () => {
				self.camera?.getList('COLOR_SPACE')
			},
		},

		record: {
			name: 'Record',
			options: [
				{
					id: 'useVariable',
					type: 'checkbox',
					label: 'Use variable input',
					default: false,
				},
				{
					id: 'val',
					type: 'dropdown',
					label: 'Record',
					default: '1',
					choices: [
						{ id: '0', label: 'Stop' },
						{ id: '1', label: 'Start' },
						{ id: '2', label: 'Toggle' },
					],
					isVisibleExpression: '!$(options:useVariable)',
				},
				{
					id: 'valVariable',
					type: 'textinput',
					label: 'Record (variable)',
					useVariables: true,
					default: '',
					isVisibleExpression: '$(options:useVariable)',
				},
			],

			callback: async (event) => {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.camera?.set('RECORD_STATE', value?.toString())
			},
		},

		generic: {
			name: 'Generic',
			options: [
				{
					id: 'commandId',
					type: 'textinput',
					label: 'Command ID',
					default: '',
					useVariables: true,
				},
				{
					id: 'argument',
					type: 'textinput',
					label: 'Argument',
					default: '',
					required: false,
					useVariables: true,
				},
			],
			callback: async (event) => {
				self.camera?.set(event.options.commandId?.toString() ?? '', event.options.argument?.toString())
			},
		},
	})
}
