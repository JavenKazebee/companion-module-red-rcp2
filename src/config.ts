import { Regex, SomeCompanionConfigField } from "@companion-module/base";

export interface ModuleConfig {
    ip: string;
}

export let configFields: SomeCompanionConfigField[] = [
    {
        type: 'textinput',
        id: 'ip',
        label: "IP address",
        width: 8,
        regex: Regex.IP
    }
];