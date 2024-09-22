import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from "@companion-module/base";
import { configFields, ModuleConfig } from "./config.js";
import updateActions from "./actions.js";
import updateVariableDefinitions from "./variables.js";
import { upgradeScripts } from "./upgrade.js"; 
import { Camera, List, Int, Str } from "red-rcp2";
import DropdownOptions from "./options.js";

export default class ModuleInstance extends InstanceBase<ModuleConfig> {
    config!: ModuleConfig;
    camera: Camera | null = null;
    options: DropdownOptions = new DropdownOptions();

    constructor(internal: unknown) {
        super(internal);
    }

    async init(config: ModuleConfig): Promise<void> { 
        this.config = config;

        this.attemptConnection();

        this.updateActions();
        this.updateVariableDefinitions();
    }

    async destroy(): Promise<void> {
        this.camera = null;
    }

    async configUpdated(config: ModuleConfig): Promise<void> {
        // If the IP has changed, clear the camera and re-connect
        if(this.config.ip != config.ip) {
            this.camera = null;
            this.config = config;
            this.attemptConnection();
        } else {
            this.config = config;
        }
	}

    getConfigFields(): SomeCompanionConfigField[] {
        return configFields;
    }

    updateActions(): void {
        updateActions(this);
    }

    updateVariableDefinitions(): void {
        updateVariableDefinitions(this);
    }

    async attemptConnection() {
        this.updateStatus(InstanceStatus.Connecting);
        try {
            this.camera = await new Camera('Companion', this.config.ip).connect();
            this.camera.onMessage((data) => {
                this.messageHandler(data);
            });
            this.subscribeActions();
            this.initalizeVariables();
            this.updateStatus(InstanceStatus.Ok);
        } catch (e) {
            this.updateStatus(InstanceStatus.ConnectionFailure);
            this.log('error', 'Camera connection failed');
        }
    }
    messageHandler(data: any) {
        switch(data.type) {
            case "rcp_cur_list":
                this.handleList(data);
                break;
            case "rcp_cur_int":
                this.handleCurInt(data);
                break;
            case "rcp_cur_str":
                this.handleCurStr(data);
                break;
        }
    }
    
    handleList(data: List) {
        // Update dropdown options
        switch(data.id) {
            case "ISO":
                this.options.iso = [];
                data.list.data.forEach((item) => {
                    this.options.iso.push({ id: item.num.toString(), label: item.num.toString() });
                });
                updateActions(this);
                break;
            case "APERTURE":
                this.options.iris = [];
                data.list.data.forEach((item) => {
                    let num = item.num / 10;
                    this.options.iris.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "EXPOSURE_ANGLE":
                this.options.shutter = [];
                data.list.data.forEach((item) => {
                    let num = item.num / 1000;
                    this.options.shutter.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "SENSOR_FRAME_RATE":
                this.options.sensorFrameRate = [];
                data.list.data.forEach((item) => {
                    let num = item.num / 1000;
                    this.options.sensorFrameRate.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "RECORD_FORMAT":
                this.options.sensorFormat = [];
                data.list.data.forEach((item) => {
                    this.options.sensorFormat.push({ id: item.num, label: item.str });
                });
                updateActions(this);
                break;
        }
    }

    handleCurInt(data: Int) {
        switch(data.id) {
            case "ISO":
                this.setVariableValues({ 'iso': data.cur.val });
                break;
            case "APERTURE":
                this.setVariableValues({ 'iris': data.cur.val / data.edit_info.divider });
                break;
            case "COLOR_TEMPERATURE":
                this.setVariableValues({ 'white_balance': data.cur.val });
                break;
            case "EXPOSURE_ANGLE":
                this.setVariableValues({ 'shutter': data.cur.val / data.edit_info.divider });
                break;
        }
    }

    handleCurStr(data: Str) {
        switch(data.id) {
            case "RECORD_FORMAT":
                this.setVariableValues({ 'sensor_format': data.display.str });
                break;
            case "SENSOR_FRAME_RATE":
                this.setVariableValues({ 'sensor_frame_rate': parseFloat(data.display.abbr)});
                break;
        }
    }

    initalizeVariables() {
        this.camera?.get("ISO");
        this.camera?.get("APERTURE"); // Iris
        this.camera?.get("COLOR_TEMPERATURE"); // White balance
        this.camera?.get("EXPOSURE_ANGLE"); // Shutter angle
        this.camera?.get("SENSOR_FRAME_RATE");
        this.camera?.get("RECORD_FORMAT"); // Sensor format
    }
}

runEntrypoint(ModuleInstance, upgradeScripts);