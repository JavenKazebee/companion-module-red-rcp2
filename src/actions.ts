import ModuleInstance from "./index.js";

export default function updateActions(self: ModuleInstance): void {
    self.setActionDefinitions({
        set_iso: {
            name: 'Set ISO',
            options: [
                {
                    id: 'num',
                    type: 'number',
                    label: 'ISO',
                    default: 320,
                    min: 0,
                    max: 65535
                },
            ],
            callback: async(event) => {
                console.log('Setting ISO to ' + event.options.num);
            }
        }
    });
}