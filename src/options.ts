import { DropdownChoice } from "@companion-module/base";

export default class DropdownOptions {
    iso: DropdownChoice[] = [];
    aperture: DropdownChoice[] = [];
    colorTemperature: DropdownChoice[] = [];
    shutter: DropdownChoice[] = [];
    sensorFrameRate: DropdownChoice[] = [];
    sensorFormat: DropdownChoice[] = [];
    cameraLuts: DropdownChoice[] = [];
    presets: DropdownChoice[] = [];
    colorSpace: DropdownChoice[] = [];
    enableDisableToggle: DropdownChoice[] = [{id: 'enable', label: 'Enable'}, 
                                            {id: 'disable', label: 'Disable'}, 
                                            {id: 'toggle', label: 'Toggle'}];
    incrementDecrementSet: DropdownChoice[] = [{id: 'increment', label: 'Increment'}, 
                                            {id: 'decrement', label: 'Decrement'},
                                            {id: 'set', label: 'Set'}];
}