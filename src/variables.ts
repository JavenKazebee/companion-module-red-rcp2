import ModuleInstance from "./index.js";

export default function updateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'iris', name: 'Iris' },
		{ variableId: 'iso', name: 'ISO' },
		{ variableId: 'white_balance', name: 'White Balance' },
	])
}