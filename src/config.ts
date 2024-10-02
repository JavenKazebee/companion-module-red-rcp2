import { Regex, SomeCompanionConfigField } from "@companion-module/base";

export interface ModuleConfig {
    ip: string;
    reconnectRate: number;
}

export let configFields: SomeCompanionConfigField[] = [
    {
        type: 'textinput',
        id: 'ip',
        label: "IP address",
        width: 8,
        regex: Regex.IP
    },
    {
        type: 'number',
        id: 'reconnectRate',
        label: 'Reconnect attempt rate (seconds)',
        min: 1,
        max: 3600,
        default: 10,
        width: 4
    }
];