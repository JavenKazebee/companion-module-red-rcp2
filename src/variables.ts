import { CompanionVariableDefinitions } from '@companion-module/base'
import ModuleInstance from './index.js'
import { PARAMETERS } from './parameters.js'

export default function updateVariableDefinitions(self: ModuleInstance): void {
	const generated: CompanionVariableDefinitions = Object.fromEntries(
		PARAMETERS.filter((def) => def.kind !== 'action' && def.cameras.includes(self.config.cameraModel)).map((def) => [
			def.variableId,
			{ name: def.label },
		]),
	)

	self.setVariableDefinitions({
		...generated,
		// CDL_* variables come from the composite `rcp_cur_cdl` message (see handleCurCDL in index.ts),
		// not from a single PARAMETERS entry, so they're defined here by hand.
		cdl_power_r: { name: 'CDL Power R' },
		cdl_power_g: { name: 'CDL Power G' },
		cdl_power_b: { name: 'CDL Power B' },
		cdl_slope_r: { name: 'CDL Slope R' },
		cdl_slope_g: { name: 'CDL Slope G' },
		cdl_slope_b: { name: 'CDL Slope B' },
		cdl_offset_r: { name: 'CDL Offset R' },
		cdl_offset_g: { name: 'CDL Offset G' },
		cdl_offset_b: { name: 'CDL Offset B' },
		cdl_saturation: { name: 'CDL Saturation' },
	})
}
