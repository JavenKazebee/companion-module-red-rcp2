import { DropdownChoice } from '@companion-module/base'

export default class DropdownOptions {
	lists: Map<string, DropdownChoice[]> = new Map()
	enableDisableToggle: DropdownChoice[] = [
		{ id: 'enable', label: 'Enable' },
		{ id: 'disable', label: 'Disable' },
		{ id: 'toggle', label: 'Toggle' },
	]
	incrementDecrementSet: DropdownChoice[] = [
		{ id: 'increment', label: 'Increment' },
		{ id: 'decrement', label: 'Decrement' },
		{ id: 'set', label: 'Set' },
	]
}
