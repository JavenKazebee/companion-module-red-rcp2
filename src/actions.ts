import { CompanionActionDefinition, CompanionActionDefinitions } from '@companion-module/base'
import ModuleInstance from './index.js'
import { PARAMETERS, ParameterDef } from './parameters.js'

function makeListAction(self: ModuleInstance, def: ParameterDef): CompanionActionDefinition {
	return {
		name: def.label,
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
				label: def.label,
				default: self.options.lists.get(def.id)?.[0]?.id ?? '',
				choices: self.options.lists.get(def.id) ?? [],
				isVisibleExpression: "$(options:selector) == 'set' && !$(options:useVariable)",
			},
			{
				id: 'valVariable',
				type: 'textinput',
				label: `${def.label} (variable)`,
				useVariables: true,
				default: '',
				isVisibleExpression: "$(options:selector) == 'set' && $(options:useVariable)",
			},
		],
		callback: async (event) => {
			const choices = self.options.lists.get(def.id) ?? []
			const currentIndex = choices.findIndex((c) => String(c.id) === String(self.getVariableValue(def.variableId)))
			// To increment/decrement, we have to not go past the ends of the list
			if (event.options.selector === 'increment' && currentIndex >= 0 && currentIndex < choices.length - 1) {
				self.cameraSet(def.id, choices[currentIndex + 1].id as number | string)
			} else if (event.options.selector === 'decrement' && currentIndex > 0) {
				self.cameraSet(def.id, choices[currentIndex - 1].id as number | string)
			} else if (event.options.selector === 'set') {
				const value = event.options.useVariable ? event.options.valVariable : event.options.val
				self.cameraSet(def.id, value as number | string)
			}
		},
		subscribe: () => {
			self.cameraGetList(def.id)
		},
	}
}

function makeValueAction(self: ModuleInstance, def: ParameterDef): CompanionActionDefinition {
	if (def.kind === 'value_enable') {
		return {
			name: def.label,
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
						self.cameraSet(def.id, 1)
						break
					case 'disable':
						self.cameraSet(def.id, 0)
						break
					case 'toggle': {
						const current = self.getVariableValue(def.variableId)
						self.cameraSet(def.id, current == 1 || current == '1' ? 0 : 1)
						break
					}
				}
			},
		}
	}

	return {
		name: def.label,
		options: [
			{ id: 'useVariable', type: 'checkbox', label: 'Use variable input', default: false },
			{
				id: 'val',
				type: 'textinput',
				label: def.label,
				default: '',
				isVisibleExpression: '!$(options:useVariable)',
			},
			{
				id: 'valVariable',
				type: 'textinput',
				label: `${def.label} (variable)`,
				useVariables: true,
				default: '',
				isVisibleExpression: '$(options:useVariable)',
			},
		],
		callback: async (event) => {
			const raw = event.options.useVariable ? event.options.valVariable : event.options.val
			const text = raw?.toString() ?? ''
			const num = Number(text)
			self.cameraSet(def.id, text !== '' && !isNaN(num) ? num : text)
		},
	}
}

function makeTriggerAction(self: ModuleInstance, def: ParameterDef): CompanionActionDefinition {
	return {
		name: def.label,
		options: [{ id: 'val', type: 'textinput', label: 'Value', default: '', required: false, useVariables: true }],
		callback: async (event) => {
			const text = event.options.val?.toString() ?? ''
			if (text === '') {
				self.cameraSet(def.id)
				return
			}
			const num = Number(text)
			self.cameraSet(def.id, !isNaN(num) ? num : text)
		},
	}
}

export default function updateActions(self: ModuleInstance): void {
	const generated: CompanionActionDefinitions = {}

	for (const def of PARAMETERS) {
		if (!def.cameras.includes(self.config.cameraModel)) continue

		switch (def.kind) {
			case 'value_list':
				generated[def.variableId] = makeListAction(self, def)
				break
			case 'value':
			case 'value_enable':
				generated[def.variableId] = makeValueAction(self, def)
				break
			case 'action':
			case 'action_with_status':
				generated[def.variableId] = makeTriggerAction(self, def)
				break
			// 'status' parameters get a variable only, no action
		}
	}

	self.setActionDefinitions({
		...generated,
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
				self.cameraSet(event.options.commandId?.toString() ?? '', event.options.argument?.toString())
			},
		},
	})
}
