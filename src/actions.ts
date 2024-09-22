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
                    choices: self.options.iso,
                },
            ],
            callback: async(event) => {
                self.camera?.set("ISO", event.options.val as number);
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
                    choices: self.options.iris,
                },
            ],
            callback: async(event) => {
                let num = event.options.val as number;
                self.camera?.set("APERTURE", num);
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
        set_shutter: {
            name: 'Set Shutter',
            options: [
                {
                    id: 'val',
                    type: 'dropdown',
                    label: 'Shutter',
                    default: '',
                    minChoicesForSearch: 3,
                    choices: self.options.shutter,
                },
            ],
            callback: async(event) => {
                let num = parseFloat(event.options.val?.toString() as string) * 1000;
                self.camera?.set("EXPOSURE_ANGLE", num);
            },
            subscribe: () => {
                self.camera?.getList("EXPOSURE_ANGLE");
            }
        },
        set_sensor_frame_rate: {
            name: 'Set Sensor Frame Rate',
            options: [
                {
                    id: 'val',
                    type: 'dropdown',
                    label: 'Frame Rate',
                    default: '',
                    minChoicesForSearch: 3,
                    choices: self.options.sensorFrameRate,
                },
            ],
            callback: async(event) => {
                self.camera?.set("SENSOR_FRAME_RATE", event.options.val as number * 1000);
            },
            subscribe: () => {
                self.camera?.getList("SENSOR_FRAME_RATE");
            }
        },
        set_sensor_format: {
            name: 'Set Sensor Format',
            options: [
                {
                    id: 'val',
                    type: 'dropdown',
                    label: 'Sensor Format',
                    default: '',
                    minChoicesForSearch: 3,
                    choices: self.options.sensorFormat,
                },
            ],
            callback: async(event) => {
                self.camera?.set("RECORD_FORMAT", event.options.val as number);
            },
            subscribe: () => {
                self.camera?.getList("RECORD_FORMAT");
            },
        },
    });
}