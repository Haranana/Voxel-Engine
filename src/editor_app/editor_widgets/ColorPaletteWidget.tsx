import { ColorPalette, reactColorTypeToRgb, rgbToReactColorType, rgbToVector3, vector4ToRgb, type ColorRGB } from "../state/ColorPalettes"
import "./ColorPaletteWidget.css"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { PhotoshopPicker} from 'react-color'
import { useContext, useEffect, useRef, useState, type ChangeEvent } from "react";
import { ControllerContext } from "../editor_controller/ControllerContext";
import SolarUploadMinimalisticOutline from "../icons/SolarUploadMinimalisticOutline";
import SolarDownloadMinimalisticOutline from "../icons/SolarDownloadMinimalisticOutline";
import MaterialSymbolsLightFormatPaintOutline from "../icons/MaterialSymbolsLightFormatPaintOutline";
import { Tooltip } from "../other_components/tooltip/Tooltip";
import SolarRefreshOutline from "../icons/SolarRefreshOutline";

export type ColorPaletteWidgetProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    version: number;
    onChanged: ()=>void;
}

export function ColorPaletteWidget(props: ColorPaletteWidgetProps){
    //const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;
    const controller = useContext(ControllerContext)!;
    const [isEditColorWindowOpen, setEditColorWindowOpen] = useState<boolean>(false);
    const [colorChangeWindowColor, setColorChangeWindowColor] = useState<ColorRGB>(controller.getCurrentColorRgb())
    const inputRef = useRef<HTMLInputElement>(null); //for palette import path

    /*
    function onPaletteChanged(){          
        setColorChangeWindowColor(vector4ToRgb(controller.getCurrentColor()));
    }*/

    async function downloadPalette(){
        try{
            const blob = await controller.getColorPalette().getPaletteBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "palette.png";
            a.click();
            URL.revokeObjectURL(url);
        }catch(e){
            console.log(e);
        }
    }

    async function uploadPalette(e: ChangeEvent<HTMLInputElement, HTMLInputElement>){
        const file = e.target.files?.[0];
        if (!file) return;

        const bitmap = await createImageBitmap(file);
        controller.getColorPalette().loadFromBitmap(bitmap);
    }

    
    useEffect(()=>{
        controller.getColorPalette().paletteChangedEvent.subscribe(props.onChanged);
    },[])

    return <div className="ColorPaletteWidget">
        <div className="ColorPaletteGrid">
        {
            Array.from(controller.getColorPalette().getPalette(), (c: ColorRGB, i)=>{
                return <div className={`ColorPaletteCell ${controller.getCurrentColorId()===i? "ChosenColorPaletteCell" : ""}`} 
                onClick={(_)=>{
                    controller.setCurrentColor(i); 
                    setColorChangeWindowColor(controller.getCurrentColorRgb());
                }}
                key={i}
                style={{background: `rgba(${c.R},${c.G},${c.B})`}}></div>
            })
        }
        </div>
        <div className="ColorPaletteOptions">
            <Tooltip text="Load Default Palette">
                <button className="ColorPaletteOptionsButton ColorPaletteLoadDefaultButton" onClick={()=>{controller.getColorPalette().loadDefaultPalette()}}>
                    <SolarRefreshOutline/>
                </button>
            </Tooltip>
            <Tooltip text="Edit Color">
                <button className="ColorPaletteOptionsButton ColorPaletteEditChosenCellButton" onClick={()=>setEditColorWindowOpen(!isEditColorWindowOpen)}>
                    <MaterialSymbolsLightFormatPaintOutline/>
                </button>
            </Tooltip>
            <Tooltip text="Export Palette">

                <button className="ColorPaletteOptionsButton ColorPaletteExportButton" onClick={()=>downloadPalette()}><SolarUploadMinimalisticOutline/></button>
            </Tooltip>
            <Tooltip text="Import Palette">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png"
                    style={{ display: "none" }}
                    onChange={(e)=>uploadPalette(e)}
                />
                <button className="ColorPaletteOptionsButton ColorPaletteImportButton" onClick={()=>inputRef.current?.click()}><SolarDownloadMinimalisticOutline/></button>
            </Tooltip>
            
        </div>
        {
            isEditColorWindowOpen? 
            <PhotoshopPicker className="EditColorWindow"  
            onChangeComplete={(_)=>{}}
            onAccept={(_)=>{
                controller.setCustomColor(controller.getCurrentColorId(), colorChangeWindowColor);   
                controller.setCurrentColor(controller.getCurrentColorId())             
                setEditColorWindowOpen(false)}
            } 
            onChange={(c)=>{
                setColorChangeWindowColor(reactColorTypeToRgb(c.rgb))}
            }
            onCancel={(_)=>{
                setEditColorWindowOpen(false); 
                setColorChangeWindowColor(controller.getCurrentColorRgb())}
            }
            color={rgbToReactColorType(colorChangeWindowColor)}></PhotoshopPicker> 
            : ""
            
        }
    </div>
}