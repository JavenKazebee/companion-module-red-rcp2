import ModuleInstance from "./index.js";

export default function updateActions(self: ModuleInstance): void {
    self.log('info', 'updateActions!!!');

    self.setActionDefinitions({
        set_iso: {
            name: 'Set ISO',
            options: [
                {
                    id: 'val',
                    type: 'dropdown',
                    label: 'ISO',
                    default: '',
                    minChoicesForSearch: 3,
                    choices: self.isoOptions,
                },
            ],
            callback: async(event) => {
                self.camera?.set("ISO", parseInt(event.options.val?.toString() as string));
            },
            subscribe: () => {
                self.camera?.getList("ISO");
            }
        },
        set_iris: {
            name: 'Set Iris',
            options: [
                {
                    id: 'val',
                    type: 'dropdown',
                    label: 'Iris',
                    default: '',
                    minChoicesForSearch: 3,
                    choices: self.irisOptions,
                },
            ],
            callback: async(event) => {
                self.camera?.set("APERTURE", parseFloat(event.options.val?.toString() as string));
            },
            subscribe: () => {
                self.camera?.getList("APERTURE");
            }
        },
        set_white_balance: {
            name: 'Set White Balance',
            options: [
                {
                    id: 'val',
                    type: 'number',
                    label: 'White Balance',
                    default: 5600,
                    min: 1700,
                    max: 10000,
                },
            ],
            callback: async(event) => {
                self.camera?.set("COLOR_TEMPERATURE", event.options.val as number);
            },
        },
        
    });
}