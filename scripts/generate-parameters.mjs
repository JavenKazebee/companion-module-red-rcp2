// Regenerates src/parameters.ts from data/rcp2-parameters.json (the parsed union
// of every parameter documented in RED's RCP2 API manuals for Komodo, Komodo-X,
// and V-Raptor/V-Raptor XL). Rerun this whenever data/rcp2-parameters.json changes
// (e.g. RED publishes updated docs): `npm run generate:parameters`.

import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dataPath = path.join(rootDir, 'data/rcp2-parameters.json')
const outPath = path.join(rootDir, 'src/parameters.ts')

const RESERVED_IDS = new Set(['generic'])

// The four niche buckets excluded from scope (approved by the user against the
// interactive coverage review): per-output display-target duplicates, soft-key
// mapping assignments, cloud-upload/AWS settings, and calibration internals.
function isOutOfScope(id) {
	if (['_BUILT_IN_LCD', '_DSI_1', '_DSI_2', '_SDI_1', '_SDI_2'].some((suffix) => id.endsWith(suffix))) return true
	if (id.startsWith('KEY_MAPPING_')) return true
	if (id.startsWith('CLOUD_UPLOAD_') || id.startsWith('CAMERA_AWS')) return true
	if (id.includes('CALIBRAT')) return true
	return false
}

function mechanicalLabel(id) {
	if (!id.includes('_')) return id // single-word ids (ISO, CDL, ND, ...) are acronyms - keep as-is
	return id
		.toLowerCase()
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

// Doc labels are generally higher quality than a mechanical id-derived title
// (e.g. APERTURE's real label is "Iris", matching RED's own camera UI) - but
// ~80 entries have no short title at all, just the first line of a longer
// description, which reads as a garbled/truncated name. Detect and fall back
// mechanically rather than hand-picking exceptions.
function cleanLabel(rawLabel, id) {
	if (!rawLabel) return mechanicalLabel(id)
	if (rawLabel.length > 60) return mechanicalLabel(id)
	if (rawLabel.includes('RCP_PARAM_')) return mechanicalLabel(id)
	return rawLabel
}

function hasAny(supportedObjects, substrings) {
	return supportedObjects.some((entry) => substrings.some((s) => entry.includes(s)))
}

function classifyKind(entry) {
	const tc = entry.type_category
	const so = entry.supported_objects
	const hasSet = so.includes('rcp_set')
	const hasList = hasAny(so, ['rcp_get_list', 'rcp_cur_list'])
	const hasValueResponse = hasAny(so, ['rcp_cur_int', 'rcp_cur_str'])

	if (tc.startsWith('Action')) {
		return hasValueResponse ? 'action_with_status' : 'action'
	}
	if (tc === 'Status') {
		return 'status'
	}
	if (tc.startsWith('Value')) {
		if (!hasSet) {
			throw new Error(`Unexpected: Value-type parameter ${entry.id} has no rcp_set`)
		}
		if (hasList) return 'value_list'
		if (entry.id.endsWith('_ENABLE')) return 'value_enable'
		return 'value'
	}
	throw new Error(`Unclassified type_category "${tc}" for parameter ${entry.id}`)
}

const raw = JSON.parse(readFileSync(dataPath, 'utf8'))

const inScope = raw.filter((entry) => !isOutOfScope(entry.id))
const generated = inScope
	.filter((entry) => entry.type_category !== 'List Only')
	.map((entry) => ({
		id: entry.id,
		variableId: entry.id.toLowerCase(),
		label: cleanLabel(entry.label, entry.id),
		cameras: entry.cameras,
		kind: classifyKind(entry),
	}))

// Self-checks - fail loudly on drift rather than silently emitting bad data.
const seenVariableIds = new Set()
for (const def of generated) {
	if (RESERVED_IDS.has(def.variableId)) {
		throw new Error(`Generated variableId "${def.variableId}" collides with a reserved hand-written action id`)
	}
	if (seenVariableIds.has(def.variableId)) {
		throw new Error(`Duplicate generated variableId "${def.variableId}"`)
	}
	seenVariableIds.add(def.variableId)
	if (def.cameras.length === 0) {
		throw new Error(`Parameter ${def.id} has no applicable cameras`)
	}
}

const KIND_ORDER = ['value_list', 'value', 'value_enable', 'status', 'action', 'action_with_status']
for (const def of generated) {
	if (!KIND_ORDER.includes(def.kind)) {
		throw new Error(`Parameter ${def.id} has invalid kind "${def.kind}"`)
	}
}

function tsStringArray(values) {
	return `[${values.map((v) => `'${v}'`).join(', ')}]`
}

const entriesSource = generated
	.map(
		(def) =>
			`\t{ id: '${def.id}', variableId: '${def.variableId}', label: ${JSON.stringify(def.label)}, cameras: ${tsStringArray(def.cameras)}, kind: '${def.kind}' },`,
	)
	.join('\n')

const output = `// GENERATED FILE - do not hand-edit.
// Produced by scripts/generate-parameters.mjs from data/rcp2-parameters.json.
// Rerun \`npm run generate:parameters\` after changing that file.

import { DropdownChoice } from '@companion-module/base'

export type CameraModel = 'komodo' | 'komodox' | 'vraptor'

export const CAMERA_MODEL_CHOICES: DropdownChoice[] = [
	{ id: 'komodo', label: 'Komodo' },
	{ id: 'komodox', label: 'Komodo-X' },
	{ id: 'vraptor', label: 'V-Raptor / V-Raptor XL' },
]

export type ParameterKind = 'value_list' | 'value' | 'value_enable' | 'status' | 'action' | 'action_with_status'

export interface ParameterDef {
	id: string
	variableId: string
	label: string
	cameras: CameraModel[]
	kind: ParameterKind
}

export const PARAMETERS: ParameterDef[] = [
${entriesSource}
]

export const PARAMETERS_BY_ID: Map<string, ParameterDef> = new Map(PARAMETERS.map((d) => [d.id, d]))
`

writeFileSync(outPath, output)
execSync(`npx prettier -w ${JSON.stringify(outPath)}`, { cwd: rootDir, stdio: 'inherit' })

console.log(`Generated ${generated.length} parameter definitions -> ${path.relative(rootDir, outPath)}`)
const kindCounts = {}
for (const def of generated) kindCounts[def.kind] = (kindCounts[def.kind] ?? 0) + 1
console.log('By kind:', kindCounts)
