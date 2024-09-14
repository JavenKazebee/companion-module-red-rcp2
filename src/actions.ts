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
                    choices: self.isoOptions,
                },
            ],
            callback: async(event) => {
                self.log('info', 'Setting ISO to ' + event.options.num);
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