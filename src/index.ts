import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from "@companion-module/base";
import { configFields, ModuleConfig } from "./config.js";
import updateActions from "./actions.js";
import updateVariableDefinitions from "./variables.js";
import { upgradeScripts } from "./upgrade.js"; 
import { Camera, Types } from "red-rcp2";
import DropdownOptions from "./options.js";
import { CurStr } from "red-rcp2/lib/types.js";

export default class ModuleInstance extends InstanceBase<ModuleConfig> {
    config!: ModuleConfig;
    camera: Camera | null = null;
    options: DropdownOptions = new DropdownOptions();
    reconnectTimer: NodeJS.Timeout | null = null;

    constructor(internal: unknown) {
        super(internal);
    }

    async init(config: ModuleConfig): Promise<void> { 
        this.config = config;

        // If connection fails, periodically attempt to reconnect
        if(!await this.attemptConnection()) {
            this.reconnectUntilConnected();
        }

        // Initialize actions and variables
        this.updateActions();
        this.updateVariableDefinitions();
    }

    async destroy(): Promise<void> {
        this.camera = null;
        clearTimeout(this.reconnectTimer as NodeJS.Timeout);
    }

    async configUpdated(config: ModuleConfig): Promise<void> {
        // If the IP has changed, clear the camera, update the ip, and re-connect
        if(this.config.ip != config.ip) {
            this.camera = null;
            this.config.ip = config.ip;
            this.attemptConnection();
        }

        // If the reconnect rate has changed, clear the current reconnection attempt and start a new one
        if(this.config.reconnectRate != config.reconnectRate) {
            this.config.reconnectRate = config.reconnectRate;
            if(this.reconnectTimer) {
                clearTimeout(this.reconnectTimer as NodeJS.Timeout);
                this.reconnectTimer = null;
            }
            this.reconnectUntilConnected();
        }

        // Update the config
        this.config = config;
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

    async attemptConnection(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            this.log('info', 'Attempting connection to ' + this.config.ip);
            // If the ip field is empty, return
            if(this.config.ip == "") {
                reject();
            }

            this.updateStatus(InstanceStatus.Connecting);
            try {
                this.log('info', 'Trying to connect...');
                this.camera = await new Camera('Companion', this.config.ip).connect();
                this.log('info', 'Camera found!');

                this.camera.on('message', (data) => {
                    this.messageHandler(data);
                });

                this.camera.on('close', () => {
                    this.updateStatus(InstanceStatus.Disconnected);
                    this.camera = null;
                    this.reconnectUntilConnected();
                });

                this.subscribeActions();
                this.initalizeVariables();
                this.updateStatus(InstanceStatus.Ok);
                
                resolve(true);
            } catch (e: any) {
                this.log('info', 'Connection failed: ' + e.message);
                if(e.code == "EHOSTDOWN") {
                    this.updateStatus(InstanceStatus.Disconnected);
                } else {
                    this.updateStatus(InstanceStatus.ConnectionFailure);
                    this.log('error', 'Camera connection failed');
                }
                resolve(false);
            }
        });
        
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
    
    handleList(data: Types.CurList) {
        // Update dropdown options
        switch(data.id) {
            case "ISO":
                this.options.iso = [];
                data.list.data.forEach((item) => {
                    this.options.iso.push({ id: item.num!.toString(), label: item.num!.toString() });
                });
                updateActions(this);
                break;
            case "APERTURE":
                this.options.iris = [];
                data.list.data.forEach((item) => {
                    let num = item.num! / 10;
                    this.options.iris.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "EXPOSURE_ANGLE":
                this.options.shutter = [];
                data.list.data.forEach((item) => {
                    let num = item.num! / 1000;
                    this.options.shutter.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "SENSOR_FRAME_RATE":
                this.options.sensorFrameRate = [];
                data.list.data.forEach((item) => {
                    let num = item.num! / 1000;
                    this.options.sensorFrameRate.push({ id: num.toString(), label: num.toString() });
                });
                updateActions(this);
                break;
            case "RECORD_FORMAT":
                this.options.sensorFormat = [];
                data.list.data.forEach((item) => {
                    this.options.sensorFormat.push({ id: item.num!, label: item.str! });
                });
                updateActions(this);
                break;
        }
    }

    handleCurInt(data: Types.CurInt) {

        const types = ["Mic", "Line", "48v"]
        const sources = ["None", "Internal Mic", "External", "Internal and External"];
        const beeps = ["None", "Beep", "Beep 2", "Beep Asc", "Beep Des", "Money", "Shutter"];
        const health = ["Normal", "Warning 1", "Warning 2", "Warning 3"];
        const colorSpaces: { [key: number]: string } = {
            15: "None",
            1: "Rec. 709",
            13: "Rec. 2020",
            16: "P3"
        };
        const fallback = ["Pause", "Continue", "Revert"];
        const priority = ["First", "Last", "Closest", "Furthest"];
        const afModes = ["Single", "Continuous"];
        const falseColorModes = ["Exposure", "Video", "Gioscope"];
        const fanModes = ["Manual", "Adaptive", "Standard"];
        const fileSystems: { [key: number]: string } = {
            "-1": "None",
            0: "FAT",
            1: "UDF",
            2: "EXFAT"
        };
        const genlockStates = ["None", "No Lock", "Genlock"];
        const languages = ["English", "Simplified Chinese", "Japanese", "German", "French", "Spanish"];
        const lensISStatus = ["Not Supported By Lens", "Not Supported By Firmware", "Off", "On"];
        const mediaStatus = ["Removed", "Inserted", "Ready", "Max Clips", "Formatting", "Unrecognized", "Mounted", "Waiting", "Timeout",
            "Error", "Ejected", "Low Speed"];
        const ndStatus = ["No Cartridge", "ND Cartridge", "Clear Cartridge"];
        const toneMaps = ["Low Contrast", "Medium Contrast", "High Contrast", "None"];
        const colorSettings = ["LOG", "3D LUT", "Custom Display"];
        const proresQuality = ["4444 XQ", "4444", "422 HQ", "422", "422 LT"];
        const proresResolution = ["1920 x 1080", "2048 x 1080", "3840 x 2160", "4096 x 2160"];
        const r3dQuality = ["HQ", "MQ", "LQ", "ELQ"];
        const recordFormats: { [key: number]: string } = {
            0: "6K FF",
            1: "5K FF",
            2: "4K FF",
            3: "6K HD",
            4: "2K FF",
            5: "6K WS",
            14: "2:1",
            15: "5K HD",
            18: "4K HD",
            35: "6K 1:1",
            42: "6K HD ANA 1:5",
            43: "6K FF ANA 1:3",
            45: "6K FF ANA 1:25",
            55: "6K 4:3 ANA 2",
            56: "6K 6:5 ANA 2",
            57: "6K 3:2 ANA 1:8",
            58: "6K 4:3 ANA 1:8",
            59: "6K 3:2 ANA 1:6",
            62: "6K 1:1 ANA 2"
        };
        const recordStates = ["Not Recording", "Recording", "Finalizing", "Pre-Recording", "Encoding"];
        const ringControlModes = ["Aperture", "Shutter", "ISO", "Color Temperature", "LCD Magnify", "SDI Magnify",
            "LCD SDI Magnify", "False Color Cycle", "Peaking Cycle", "Tools Cycle"];
        const rollOffs = ["None", "Hard", "Medium", "Soft", "Very Soft"];
        const wifiModes = ["Disabled", "Ad Hoc", "Infrastructure"];
        const wifiStatus = ["Offline", "Searching", "Connecting", "Connected", "Lost", "Error"];


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
            case "POWER_IN_ACTIVE":
                let name = data.cur.val == 1 ? 'Battery' : 'DC';
                this.setVariableValues({ 'active_power_source': name });
                break;
            case "AF_ENABLE":
                this.setVariableValues({ 'autofocus': data.cur.val ? 'On' : 'Off' });
                break;
            case "AF_MODE":
                this.setVariableValues({ 'autofocus_mode': afModes[data.cur.val] });
                break;
            case "AF_POSITION":
                let positions = ["Left", "Left Center Top", "Left Center Bottom", "Center Top", "Center Middle", 
                    "Center Bottom", "Right Center Top", "Right Center Bottom", "Right", "Custom"];
                this.setVariableValues({ 'autofocus_position': positions[data.cur.val] });
                break;
            case "AF_SIZE":
                let sizes = ["Small", "Medium", "Large", "Wide", "Vertical"]
                this.setVariableValues({ 'af_size': sizes[data.cur.val] });
                break;
            case "APPLIED_CAMERA_LUT":
                this.setVariableValues({ 'applied_camera_lut': data.cur.val });
                break;
            case "AUDIO_EXTERNAL_LEFT_GAIN":
                this.setVariableValues({ 'audio_external_left_gain': data.cur.val });
                break;
            case "AUDIO_EXTERNAL_RIGHT_GAIN":
                this.setVariableValues({ 'audio_external_right_gain': data.cur.val });
                break;
            case "AUDIO_EXTERNAL_LINK_GAIN":
                this.setVariableValues({ 'audio_external_link_gain': data.cur.val ? 'On' : 'Off' });
                break;
            case "AUDIO_HEADPHONE_MUTE":
                this.setVariableValues({ 'audio_headphone_mute': data.cur.val ? 'Not Muted' : 'Muted' });
                break;
            case "AUDIO_HEADPHONE_SOURCE":
                this.setVariableValues({ 'audio_headphone_source': sources[data.cur.val] });
                break;
            case "AUDIO_INPUT_TYPE_CH3":
                this.setVariableValues({ 'audio_input_type_ch3': types[data.cur.val] });
                break;
            case "AUDIO_INPUT_TYPE_CH4":
                this.setVariableValues({ 'audio_input_type_ch4': types[data.cur.val] });
                break;
            case "AUDIO_INTERNAL_LEFT_GAIN":
                this.setVariableValues({ 'audio_internal_left_gain': data.cur.val });
                break;
            case "AUDIO_INTERNAL_RIGHT_GAIN":
                this.setVariableValues({ 'audio_internal_right_gain': data.cur.val });
                break;
            case "AUDIO_INTERNAL_LINK_GAIN":
                this.setVariableValues({ 'audio_internal_link_gain': data.cur.val ? 'On' : 'Off' });
                break;
            case "AUDIO_LIMITER_ENABLE_CH3":
                this.setVariableValues({ 'audio_limiter_enable_ch3': data.cur.val ? 'On' : 'Off' });
                break;
            case "AUDIO_LIMITER_ENABLE_CH4":
                this.setVariableValues({ 'audio_limiter_enable_ch4': data.cur.val ? 'On' : 'Off' });
                break;
            case "AUDIO_LIMITER_LEVEL_CH3":
                this.setVariableValues({ 'audio_limiter_level_ch3': data.cur.val });
                break;
            case "AUDIO_LIMITER_LEVEL_CH4":
                this.setVariableValues({ 'audio_limiter_level_ch4': data.cur.val });
                break;
            case "AUDIO_SOURCE":
                this.setVariableValues({ 'audio_source': sources[data.cur.val] });
                break;
            case "BEEP_ENABLE":
                this.setVariableValues({ 'beep_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "BEEP_RECORD_START":
                this.setVariableValues({ 'beep_record_start': beeps[data.cur.val]});
                break;
            case "BEEP_RECORD_STOP":
                this.setVariableValues({ 'beep_record_stop': beeps[data.cur.val]});
                break;
            case "CAMERA_HEALTH":
                this.setVariableValues({ 'camera_health': health[data.cur.val] });
                break;
            case "CAMERA_LUT_ENABLE":
                this.setVariableValues({ 'camera_lut_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "CAMERA_PIN":
                this.setVariableValues({ 'camera_pin': data.cur.val });
                break;
            case "CAMERA_RUNTIME":
                this.setVariableValues({ 'camera_runtime': data.cur.val });
                break;
            case "CAMERA_TYPE":
                this.setVariableValues({ 'camera_type': data.cur.val });
                break;
            case "CARTRIDGE_NAME":
                this.setVariableValues({ 'cartridge_name': data.cur.val });
                break;
            case "CDL":
                this.setVariableValues({ 'cdl': data.cur.val });
                break;
            case "CDL_ENABLE":
                this.setVariableValues({ 'cdl_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "CLIP_DURATION":
                this.setVariableValues({ 'clip_duration': data.cur.val });
                break;
            case "CLIP_NAME_2":
                this.setVariableValues({ 'clip_name_2': data.cur.val });
                break;
            case "COLOR_SPACE":
                this.setVariableValues({ 'color_space': colorSpaces[data.cur.val] });
                break;
            case "DATE":
                this.setVariableValues({ 'date': data.cur.val });
                break;
            case "EXPOSURE_ADJUST":
                this.setVariableValues({ 'exposure_adjust': data.cur.val });
                break;
            case "FACE_DETECTION_ENABLE":
                this.setVariableValues({ 'face_detection_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "FACE_DETECTION_FALLBACK":
                this.setVariableValues({ 'face_detection_fallback': fallback[data.cur.val] });
                break;
            case "FACE_DETECTION_PRIORITY":
                this.setVariableValues({ 'face_detection_priority': priority[data.cur.val] });
                break;
            case "FALSE_COLOR_ENABLE":
                this.setVariableValues({ 'false_color_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "FALSE_COLOR_MODE":
                this.setVariableValues({ 'false_color_mode': falseColorModes[data.cur.val] });
                break;
            case "FAN_MODE":
                this.setVariableValues({ 'fan_mode': fanModes[data.cur.val] });
                break;
            case "FOCUS_DIST_FAR":
                this.setVariableValues({ 'focus_dist_far': data.cur.val });
                break;
            case "FOCUS_DIST_NEAR":
                this.setVariableValues({ 'focus_dist_near': data.cur.val });
                break;
            case "FOCUST_DIST_MARK":
                this.setVariableValues({ 'focust_dist_mark': data.cur.val });
                break;
            case "FILE_SYSTEM":
                this.setVariableValues({ 'file_system': fileSystems[data.cur.val] });
                break;
            case "REEL_NUMBER":
                this.setVariableValues({ 'reel_number': data.cur.val });
                break;
            case "FRAME_LIMIT_ENABLE":
                this.setVariableValues({ 'frame_limit_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "FRAME_LIMIT_FRAMES":
                this.setVariableValues({ 'frame_limit_frames': data.cur.val });
                break;
            case "FRAME_LIMIT_PLAYBACK_DURATION":
                this.setVariableValues({ 'frame_limit_playback_duration': data.cur.val });
                break;
            case "GAIN":
                this.setVariableValues({ 'gain': data.cur.val });
                break;
            case "GENLOCK_STATE":
                this.setVariableValues({ 'genlock_state': genlockStates[data.cur.val] });
                break;
            case "HEADPHONE_VOLUME":
                this.setVariableValues({ 'headphone_volume': data.cur.val });
                break;
            case "IEFT_LANGUAGE_TAG":
                this.setVariableValues({ 'ieft_language_tag': data.cur.val });
                break;
            case "LANGUAGE":
                this.setVariableValues({ 'language': languages[data.cur.val] });
                break;
            case "LENS_BRAND":
                this.setVariableValues({ 'lens_brand': data.cur.val });
                break;
            case "LENS_FOCAL_LENGTH":
                this.setVariableValues({ 'lens_focal_length': data.cur.val });
                break;
            case "LENS_FOCUS_DISTANCE":
                this.setVariableValues({ 'lens_focus_distance': data.cur.val });
                break;
            case "LENS_HYPERFOCAL_DISTANCE":
                this.setVariableValues({ 'lens_hyperfocal_distance': data.cur.val });
                break;
            case "LENS_IS_STATUS":
                this.setVariableValues({ 'lens_is_status': lensISStatus[data.cur.val] });
                break;
            case "LENS_META_NAME":
                this.setVariableValues({ 'lens_meta_name': data.cur.val });
                break;
            case "LENS_OWNER":
                this.setVariableValues({ 'lens_owner': data.cur.val });
                break;
            case "LENS_SERIAL_NUMBER":
                this.setVariableValues({ 'lens_serial_number': data.cur.val });
                break;
            case "LOG_VIEW_ENABLE":
                this.setVariableValues({ 'log_view_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "MEDIA_APPROVED_STATUS":
                this.setVariableValues({ 'media_approved_status': data.cur.val ? 'Approved' : 'Unnapproved' });
                break;
            case "MEDIA_CAPACITY":
                this.setVariableValues({ 'media_capacity': data.cur.val });
                break;
            case "MEDIA_CLIP_COUNT":
                this.setVariableValues({ 'media_clip_count': data.cur.val });
                break;
            case "MEDIA_CLIP_EXT_INFO":
                this.setVariableValues({ 'media_clip_info': data.cur.val });
                break;
            case "MEDIA_FIRMWARE_VERSION":
                this.setVariableValues({ 'media_firmware_version': data.cur.val });
                break;
            case "MEDIA_MODEL_NUMBER":
                this.setVariableValues({ 'media_model_number': data.cur.val });
                break;
            case "MEDIA_NAME":
                this.setVariableValues({ 'media_name': data.cur.val ? 'CFast' : 'CFExpress'});
                break;
            case "MEDIA_PERCENTAGE_REMAINING":
                this.setVariableValues({ 'media_percentage_remaining': data.cur.val });
                break;
            case "MEDIA_SERIAL_NUMBER":
                this.setVariableValues({ 'media_serial_number': data.cur.val });
                break;
            case "MEDIA_STATUS":                
                this.setVariableValues({ 'media_status': mediaStatus[data.cur.val] });
                break;
            case "MEDIA_TIME_REMAINING":
                this.setVariableValues({ 'media_time_remaining': data.cur.val });
                break;
            case "ND":
                this.setVariableValues({ 'nd': data.cur.val });
                break;
            case "ND_DISPLAY":
                this.setVariableValues({ 'nd_display': ndStatus[data.cur.val] });
                break;
            case "OUTPUT_TONE_MAP":
                this.setVariableValues({ 'output_tone_map': toneMaps[data.cur.val] });
                break;
            case "PDAF_STATS":
                this.setVariableValues({ 'pdaf_stats': data.cur.val });
                break;
            case "PLAYBACK_LENGTH":
                this.setVariableValues({ 'playback_length': data.cur.val });
                break;
            case "PLAYBACK_LOOP":
                this.setVariableValues({ 'playback_loop': data.cur.val ? 'On' : 'Off' });
                break;
            case "PLAYBACK_RATE":
                this.setVariableValues({ 'playback_rate': data.cur.val ? 'Project FPS' : 'Sensor FPS' });
                break;
            case "PLAYBACK_STATE":
                this.setVariableValues({ 'playback_state': data.cur.val ? 'In Playback' : 'Not In Playback' });
                break;
            case "POWER_OUT_ENABLE":
                this.setVariableValues({ 'power_out_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "PROJECT_FRAME_RATE":
                this.setVariableValues({ 'project_frame_rate': data.cur.val });
                break;
            case "PRORES_BAKED_IN_SETTINGS":
                this.setVariableValues({ 'prores_baked_in_settings': colorSettings[data.cur.val] });
                break;
            case "PRORES_QUALITY":
                this.setVariableValues({ 'prores_quality': proresQuality[data.cur.val] });
                break;
            case "PRORES_RESOLUTION":
                this.setVariableValues({ 'prores_resolution': proresResolution[data.cur.val] });
                break;
            case "R3D_QUALITY":
                this.setVariableValues({ 'r3d_quality': r3dQuality[data.cur.val] });
                break;
            case "RCP_VERSION":
                this.setVariableValues({ 'rcp_version': data.cur.val });
                break;
            case "RECORD_CODEC":
                this.setVariableValues({ 'record_codec': data.cur.val ? 'ProRes' : 'R3D' });
                break;
            case "RECORD_FORMAT":
                this.setVariableValues({ 'record_format': recordFormats[data.cur.val] });
                break;
            case "RECORD_MODE":
                this.setVariableValues({ 'record_mode': data.cur.val ? 'Timelapse' : 'Continuous' });
                break;
            case "RECORD_STATE":
                this.setVariableValues({ 'record_state': recordStates[data.cur.val] });
                break;
            case "RF_IRIS_COMPENSATION_ENABLE":
                this.setVariableValues({ 'rf_iris_compensation_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "RF_RING_CONTROL":
                this.setVariableValues({ 'rf_ring_control': ringControlModes[data.cur.val] });
                break;
            case "RF_RING_ENABLE":
                this.setVariableValues({ 'rf_ring_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "ROLL_OFF":
                this.setVariableValues({ 'roll_off': rollOffs[data.cur.val] });
                break;
            case "SDI_COLOR_SETTING":
                this.setVariableValues({ 'sdi_color_setting': colorSettings[data.cur.val] });
                break;
            case "SENSOR_FLIP_MIRROR":
                this.setVariableValues({ 'sensor_flip_mirror': data.cur.val ? 'On' : 'Off' });
                break;
            case "SENSOR_FRAME_RATE":
                this.setVariableValues({ 'sensor_frame_rate': data.cur.val });
                break;
            case "TALLY_LED_ENABLE":
                this.setVariableValues({ 'tally_led_enable': data.cur.val ? 'On' : 'Off' });
                break;
            case "TIME":
                this.setVariableValues({ 'time': data.cur.val });
                break;
            case "TIMECODE":
                this.setVariableValues({ 'timecode': data.cur.val });
                break;
            case "TINT":
                this.setVariableValues({ 'tint': data.cur.val });
                break;
            case "WIFI_INFRASTRUCTURE_SSID":
                this.setVariableValues({ 'wifi_infrastructure_ssid': data.cur.val });
                break;
            case "WIFI_IP_ADDRESS":
                this.setVariableValues({ 'wifi_ip_address': data.cur.val });
                break;
            case "WIFI_MAC_ADDRESS":
                this.setVariableValues({ 'wifi_mac_address': data.cur.val });
                break;
            case "WIFI_MODE":
                this.setVariableValues({ 'wifi_mode': wifiModes[data.cur.val] });
                break;
            case "WIFI_STATUS":
                this.setVariableValues({ 'wifi_status': wifiStatus[data.cur.val] });
                break;
        }
    }

    handleCurStr(data: CurStr) {
        switch(data.id) {
            case "RECORD_FORMAT":
                this.setVariableValues({ 'sensor_format': data.display.str });
                break;
            case "SENSOR_FRAME_RATE":
                this.setVariableValues({ 'sensor_frame_rate': parseFloat(data.display.abbr)});
                break;
            case "CAMERA_FIRMWARE_VERSION":
                this.setVariableValues({ 'camera_firmware_version': data.display.str });
                break;
            case "CAMERA_ID":
                this.setVariableValues({ 'camera_id': data.display.str });
                break;
            case "CAMERA_LUT":
                this.setVariableValues({ 'camera_lut': data.display.str });
                break;
        }
    }

    initalizeVariables() {
        const vars = [
            "ISO", "APERTURE", "COLOR_TEMPERATURE", "EXPOSURE_ANGLE", "SENSOR_FRAME_RATE", "RECORD_FORMAT",
            "POWER_IN_ACTIVE", "AF_ENABLE", "AF_MODE", "AF_POSITION", "AF_SIZE", "APPLIED_CAMERA_LUT", "AUDIO_EXTERNAL_LEFT_GAIN",
            "AUDIO_EXTERNAL_RIGHT_GAIN", "AUDIO_EXTERNAL_LINK_GAIN", "AUDIO_HEADPHONE_MUTE", "AUDIO_HEADPHONE_SOURCE",
            "AUDIO_INPUT_TYPE_CH3", "AUDIO_INPUT_TYPE_CH4", "AUDIO_INTERNAL_LEFT_GAIN", "AUDIO_INTERNAL_RIGHT_GAIN",
            "AUDIO_INTERNAL_LINK_GAIN", "AUDIO_LIMITER_ENABLE_CH3", "AUDIO_LIMITER_ENABLE_CH4", "AUDIO_LIMITER_LEVEL_CH3",
            "AUDIO_LIMITER_LEVEL_CH4", "AUDIO_SOURCE", "BEEP_ENABLE", "BEEP_RECORD_START", "BEEP_RECORD_STOP", "CAMERA_FIRMWARE_VERSION",
            "CAMERA_HEALTH", "CAMERA_ID", "CAMERA_LUT", "CAMERA_LUT_ENABLE", "CAMERA_PIN", "CAMERA_RUNTIME", "CAMERA_TYPE",
            "CARTRIDGE_NAME", "CDL", "CDL_ENABLE", "CLIP_DURATION", "CLIP_NAME_2", "COLOR_SPACE", "DATE", "EXPOSURE_ADJUST",
            "FACE_DETECTION_ENABLE", "FACE_DETECTION_FALLBACK", "FACE_DETECTION_PRIORITY", "FALSE_COLOR_ENABLE", "FALSE_COLOR_MODE",
            "FAN_MODE", "FOCUST_DIST_FAR", "FOCUST_DIST_NEAR", "FOCUST_DIST_MARK", "FILE_SYSTEM", "REEL_NUMBER", "FRAME_LIMIT_ENABLE", 
            "FRAME_LIMIT_FRAMES", "FRAME_LIMIT_PLAYBACK_DURATION", "GAIN", "GENLOCK_STATE", "HEADPHONE_VOLUME", "IEFT_LANGUAGE_TAG", 
            "LANGUAGE", "LENS_BRAND", "LENS_FOCAL_LENGTH", "LENS_FOCUS_DISTANCE", "LENS_HYPERFOCAL_DISTANCE", "LENS_IS_STATUS", 
            "LENS_META_NAME", "LENS_OWNER", "LENS_SERIAL_NUMBER", "LOG_VIEW_ENABLE", "MEDIA_APPROVED_STATUS", "MEDIA_CAPACITY", 
            "MEDIA_CLIP_COUNT", "MEDIA_CLIP_EXT_INFO", "MEDIA_FIRMWARE_VERSION", "MEDIA_MODEL_NUMBER", "MEDIA_NAME", "MEDIA_PERCENTAGE_REMAINING", 
            "MEDIA_SERIAL_NUMBER", "MEDIA_STATUS", "MEDIA_TIME_REMAINING", "ND", "ND_DISPLAY", "OUTPUT_TONE_MAP", "PDAF_STATS", "PLAYBACK_LENGTH", 
            "PLAYBACK_LOOP", "PLAYBACK_RATE", "PLAYBACK_STATE", "POWER_OUT_ENABLE", "PROJECT_FRAME_RATE", "PRORES_BAKED_IN_SETTINGS", 
            "PRORES_QUALITY", "PRORES_RESOLUTION", "R3D_QUALITY", "RCP_VERSION", "RECORD_CODEC", "RECORD_FORMAT", "RECORD_MODE", "RECORD_STATE", 
            "RF_IRIS_COMPENSATION_ENABLE", "RF_RING_CONTROL", "RF_RING_ENABLE", "ROLL_OFF", "SDI_COLOR_SETTING", "SENSOR_FLIP_MIRROR", 
            "SENSOR_FRAME_RATE", "TALLY_LED_ENABLE", "TIME", "TIMECODE", "TINT", "WIFI_INFRASTRUCTURE_SSID", "WIFI_IP_ADDRESS", "WIFI_MAC_ADDRESS", 
            "WIFI_MODE", "WIFI_STATUS"
        ]

        for (const v in vars) {
            this.camera?.get(vars[v]);
        }
    }

    async reconnectUntilConnected() {
        this.log('info', 'Setting up reconnect timer.')
        // Create interval
        this.reconnectTimer = setInterval(async () => {
            // Attempt to reconnect
            if(await this.attemptConnection()) {
                this.log('info', 'Reconnection successful.');
                // If successful, clear interval
                clearInterval(this.reconnectTimer as NodeJS.Timeout);
                this.reconnectTimer = null;
            }
        }, 1000 * this.config.reconnectRate);
    }
}

runEntrypoint(ModuleInstance, upgradeScripts);