import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from "@companion-module/base";
import { configFields, ModuleConfig } from "./config.js";
import updateActions from "./actions.js";
import { upgradeScripts } from "./upgrade.js"; 
import { Camera } from "red-rcp2";

export default class ModuleInstance extends InstanceBase<ModuleConfig> {
    config!: ModuleConfig;
    camera: Camera | null = null;

    constructor(internal: unknown) {
        super(internal);
    }

    async init(config: ModuleConfig): Promise<void> { 
        this.config = config;

        this.attemptConnection();

        this.updateActions();
    }

    async destroy(): Promise<void> {

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
        try {
            this.camera = await new Camera("Companion", this.config.ip).connect();
            this.updateStatus(InstanceStatus.Ok);
        } catch (e) {
            this.updateStatus(InstanceStatus.ConnectionFailure);
            this.log('error', "Camera connection failed");
        }
    }
}

runEntrypoint(ModuleInstance, upgradeScripts);