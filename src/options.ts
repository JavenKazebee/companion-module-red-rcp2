import { DropdownChoice } from "@companion-module/base";

export default class DropdownOptions {
    iso: DropdownChoice[] = [];
    iris: DropdownChoice[] = [];
    shutter: DropdownChoice[] = [];
    sensorFrameRate: DropdownChoice[] = [];
    sensorFormat: DropdownChoice[] = [];
    cameraLuts: DropdownChoice[] = [];
    enableDisableToggle: DropdownChoice[] = [{id: 'enable', label: 'Enable'}, 
                                            {id: 'disable', label: 'Disable'}, 
                                            {id: 'toggle', label: 'Toggle'}];
}