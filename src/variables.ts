import ModuleInstance from "./index.js";

export default function updateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'iris', name: 'Iris' },
		{ variableId: 'iso', name: 'ISO' },
		{ variableId: 'white_balance', name: 'White Balance' },
		{ variableId: 'shutter', name: 'Shutter' },
		{ variableId: 'sensor_frame_rate', name: 'Sensor Frame Rate' },
		{ variableId: 'sensor_format', name: 'Sensor Format' },
		{ variableId: 'active_power_source', name: 'Active Power Source' }
	])
}