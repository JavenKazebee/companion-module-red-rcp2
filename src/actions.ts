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
        get_types: {
            name: 'Get Types',
            options: [],
            callback: async() => {
                console.log("Types: " + self.camera?.types);
            }
        }
    });
}