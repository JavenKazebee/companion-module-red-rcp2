import { DropdownChoice, InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from "@companion-module/base";
import { configFields, ModuleConfig } from "./config.js";
import updateActions from "./actions.js";
import { upgradeScripts } from "./upgrade.js"; 
import { Camera, List } from "red-rcp2";

export default class ModuleInstance extends InstanceBase<ModuleConfig> {
    config!: ModuleConfig;
    camera: Camera | null = null;
    isoOptions: DropdownChoice[] = [];

    constructor(internal: unknown) {
        super(internal);
    }

    async init(config: ModuleConfig): Promise<void> { 
        this.config = config;

        this.attemptConnection();

        this.updateActions();
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

    async attemptConnection() {
        this.updateStatus(InstanceStatus.Connecting);
        try {
            this.camera = await new Camera('Companion', this.config.ip).connect();
            this.camera.onMessage((data) => {
                this.messageHandler(data);
            });
            this.subscribeActions();
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
        }
    }
    
    handleList(data: List) {
        switch(data.id) {
            case "ISO":
                this.isoOptions = [];
                data.list.data.forEach((item) => {
                    this.isoOptions.push({ id: item.num.toString(), label: item.num.toString() });
                });
                updateActions(this);
                break;
        }
    }
}

runEntrypoint(ModuleInstance, upgradeScripts);