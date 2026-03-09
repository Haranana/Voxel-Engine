
import type { Camera, ProjectionType } from "../classes/camera";
import RenderableObjectProperties from "./RenderableObjectProperties";

export type CameraPropertiesProps = {
    camera: Camera;
    onCameraChange: (camera: Camera) => void;
};

export default function CameraPropertiesWidget(props: CameraPropertiesProps) {
    const camera = props.camera;

    const onFovYChange = (newVal: number) => {
        props.onCameraChange({
            ...camera,
            fovY: newVal,
        });
    };

    const onNearChange = (newVal: number) => {
        const clampedNear = Math.max(0.001, newVal);
        const fixedFar = clampedNear >= camera.far ? clampedNear + 0.001 : camera.far;

        props.onCameraChange({
            ...camera,
            near: clampedNear,
            far: fixedFar,
        });
    };

    const onFarChange = (newVal: number) => {
        const clampedFar = Math.max(0.001, newVal);
        const fixedNear = clampedFar <= camera.near ? Math.max(0.001, clampedFar - 0.001) : camera.near;

        props.onCameraChange({
            ...camera,
            near: fixedNear,
            far: clampedFar,
        });
    };

    const onProjectionTypeChange = (newVal: ProjectionType) => {
        props.onCameraChange({
            ...camera,
            projectionType: newVal,
        });
    };

    const onTransformChange = (newTransform: Camera["transform"]) => {
        props.onCameraChange({
            ...camera,
            transform: newTransform,
        });
    };

    return (
        <div className="CameraProperties EditorWidget">
            <div className="WidgetSection">
                <div className="WidgetSubsection">
                    <p className="InputValue">Projection type: {camera.projectionType}</p>
                    <select
                        className="Input"
                        value={camera.projectionType}
                        onChange={(e) => onProjectionTypeChange(e.target.value as ProjectionType)}
                    >
                        <option value="perspective">perspective</option>
                        <option value="orthographic">orthographic</option>
                    </select>
                </div>

                <div className="WidgetSubsection">
                    <p className="InputValue">Fov Y: {camera.fovY}°</p>
                    <input
                        className="Input"
                        type="range"
                        min="1"
                        max="179"
                        step="1"
                        value={camera.fovY}
                        onChange={(e) => onFovYChange(parseFloat(e.target.value))}
                    />
                </div>

                <div className="WidgetSubsection">
                    <p className="InputValue">Near: {camera.near}</p>
                    <input
                        className="Input"
                        type="range"
                        min="0.001"
                        max="1000"
                        step="0.001"
                        value={camera.near}
                        onChange={(e) => onNearChange(parseFloat(e.target.value))}
                    />
                </div>

                <div className="WidgetSubsection">
                    <p className="InputValue">Far: {camera.far}</p>
                    <input
                        className="Input"
                        type="range"
                        min="0.001"
                        max="5000"
                        step="0.001"
                        value={camera.far}
                        onChange={(e) => onFarChange(parseFloat(e.target.value))}
                    />
                </div>
            </div>

            <RenderableObjectProperties
                objectProperties={camera.transform}
                onPropertiesChange={onTransformChange}
            />
        </div>
    );
}