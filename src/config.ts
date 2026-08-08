import { Regex, SomeCompanionConfigField } from '@companion-module/base'
import { CAMERA_MODEL_CHOICES, CameraModel } from './parameters.js'

export interface ModuleConfig {
	ip: string
	reconnectRate: number
	cameraModel: CameraModel
}

export let configFields: SomeCompanionConfigField[] = [
	{
		type: 'textinput',
		id: 'ip',
		label: 'IP address',
		width: 8,
		regex: Regex.IP,
	},
	{
		type: 'number',
		id: 'reconnectRate',
		label: 'Reconnect attempt rate (seconds)',
		min: 1,
		max: 3600,
		default: 10,
		width: 4,
	},
	{
		type: 'dropdown',
		id: 'cameraModel',
		label: 'Camera Model',
		width: 6,
		default: 'komodo',
		choices: CAMERA_MODEL_CHOICES,
	},
]
