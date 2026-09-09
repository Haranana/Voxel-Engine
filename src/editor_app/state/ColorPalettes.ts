import type { RGBColor } from "react-color";
import { Vector4 } from "../../math/vector4.type";
import { Vector3 } from "../../math/vector3.type";
import { VoxelEngineEvent } from "../../voxel_engine/events/event";

export type ColorRGB = {
    R: number,
    G: number,
    B: number, 
}

export type ColorHSV = {
    H: number,
    S: number,
    V: number, 
}

export type ColorHex = string;

export function rgbToHsv(c: ColorRGB): ColorHSV {
    const r = c.R / 255;
    const g = c.G / 255;
    const b = c.B / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;

    if (d !== 0) {
        if (max === r) {
            h = ((g - b) / d) % 6;
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else {
            h = (r - g) / d + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : d / max;
    const v = max;

    return { H: h, S: s, V: v };
}

export function rgbToHex(c: ColorRGB): ColorHex {
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    return `#${toHex(c.R)}${toHex(c.G)}${toHex(c.B)}`;
}

export function hexToRgb(c: ColorHex): ColorRGB {
    const hex = c.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { R: r, G: g, B: b };
}

export function hexToHsv(c: ColorHex): ColorHSV {
    return rgbToHsv(hexToRgb(c));
}

export function hsvToRgb(c: ColorHSV): ColorRGB {
    const h = c.H;
    const s = c.S;
    const v = c.V;

    const c1 = v * s;
    const x = c1 * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c1;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
        r = c1; g = x; b = 0;
    } else if (h < 120) {
        r = x; g = c1; b = 0;
    } else if (h < 180) {
        r = 0; g = c1; b = x;
    } else if (h < 240) {
        r = 0; g = x; b = c1;
    } else if (h < 300) {
        r = x; g = 0; b = c1;
    } else {
        r = c1; g = 0; b = x;
    }

    return {
        R: Math.round((r + m) * 255),
        G: Math.round((g + m) * 255),
        B: Math.round((b + m) * 255),
    };
}

export function hsvToHex(c: ColorHSV): ColorHex {
    return rgbToHex(hsvToRgb(c));
}

export function rgbToVector4(c: ColorRGB, a: number = 255): Vector4{
    return new Vector4(c.R, c.G, c.B, a);
}

export function vector4ToRgb(v: Vector4): ColorRGB{
    return{
        R: v.x,
        G: v.y,
        B: v.z
    };
}

export function rgbToVector3(c: ColorRGB): Vector3{
    return new Vector3(c.R, c.G, c.B);
}

export function rgbToReactColorType(c: ColorRGB): RGBColor{
    return {
        r: c.R,
        g: c.G,
        b: c.B,
    }
}

export function reactColorTypeToRgb(c: RGBColor): ColorRGB{
    return {
        R: c.r,
        G: c.g,
        B: c.b,
    };
}



export class ColorPalette{

    // Maximum amount of cells that 
    // 512 was picked arbitrary, but some limit is necessary nonetheless
    readonly maxPaletteSize = 512;
    // Actual amount of cells in this palette
    paletteSize = 60;
    #palette : ColorRGB[] = this.#loadPalette(); 

    paletteChangedEvent: VoxelEngineEvent<void> = new VoxelEngineEvent();
    #notifyOnPaletteChanged(){
        this.paletteChangedEvent.emit();
    }

    // Loads palette from local storage 
    // if any exception during loading is found the default palette is loaded instead
    #loadPalette(): ColorRGB[]{
        const json : string | null = localStorage.getItem("customPalette");
        if(!json){
            return this.#generateDefaultPalette();
        }
        try {
            return JSON.parse(json) as ColorRGB[];
        }
        catch {
            return this.#generateDefaultPalette();
        }
    }

    loadDefaultPalette(){
        this.#palette = this.#generateDefaultPalette();
        this.#notifyOnPaletteChanged();
    }

    #generateDefaultPalette(): ColorRGB[]{
        const basicColors = [
            { R: 0,   G: 0,   B: 0   }, // Black
            { R: 64,  G: 64,  B: 64  },
            { R: 128, G: 128, B: 128 },
            { R: 192, G: 192, B: 192 },
            { R: 255, G: 255, B: 255 }, // White

            { R: 255, G: 0,   B: 0   }, // Red
            { R: 192, G: 0,   B: 0   },
            { R: 255, G: 128, B: 128 },

            { R: 255, G: 128, B: 0   }, // Orange
            { R: 192, G: 96,  B: 0   },

            { R: 139, G: 69,  B: 19  }, // Brown
            { R: 245, G: 222, B: 179 }, // Beige

            { R: 255, G: 255, B: 0   }, // Yellow
            { R: 192, G: 192, B: 0   },

            { R: 128, G: 255, B: 0   }, // Lime
            { R: 96,  G: 192, B: 0   },

            { R: 0,   G: 255, B: 0   }, // Green
            { R: 0,   G: 192, B: 0   },

            { R: 0,   G: 255, B: 128 }, // Spring Green
            { R: 0,   G: 192, B: 96  },

            { R: 0,   G: 255, B: 255 }, // Cyan
            { R: 0,   G: 192, B: 192 },

            { R: 0,   G: 128, B: 255 }, // Sky Blue
            { R: 0,   G: 96,  B: 192 },

            { R: 0,   G: 0,   B: 255 }, // Blue
            { R: 0,   G: 0,   B: 192 },

            { R: 128, G: 0,   B: 255 }, // Violet
            { R: 96,  G: 0,   B: 192 },

            { R: 255, G: 0,   B: 255 }, // Magenta
            { R: 192, G: 0,   B: 192 },
        ];        

        const emptyColors = [];
        for(let i=0; i<this.paletteSize/2; i++){
            emptyColors.push(
                { R: 255, G: 255, B: 255 }
            );
        }

        return basicColors.concat(emptyColors);
    }    

    // Converts this palette to Blob, for exporting    
    async getPaletteBlob(): Promise<Blob>{
        const paletteToArray = (p: ColorRGB[]): Uint8ClampedArray<ArrayBuffer> => {
            const out = new Uint8ClampedArray(p.length * 4);
            let offset = 0;
            p.forEach(c=>{
                out[offset] = c.R;
                out[offset+1] = c.G;
                out[offset+2] = c.B;
                out[offset+3] = 255;
                offset+=4
            })
            return out;
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = this.#palette.length;
        canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        const imageData = new ImageData(
            paletteToArray(this.#palette),
            canvas.width,
            canvas.height
        );
        ctx.putImageData(imageData, 0, 0);
        const promise = new Promise<Blob>((resolve, reject) => (
            canvas.toBlob((blob)=>{return blob? resolve(blob) : reject(new Error("couldn't create blob of palette"))},"image/png")
        ));
        return promise;
    }

    // Loads palette from .png bitmap
    async loadFromBitmap(bitmap: ImageBitmap){
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0);

        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        
        const newPaletteSize = Math.min(imageData.data.length/4, this.maxPaletteSize);
        const newPalette: ColorRGB[] = [];
        for(let i=0; i<4*newPaletteSize; i+=4){
            const R = imageData.data[i];
            const G = imageData.data[i+1];
            const B = imageData.data[i+2];
            newPalette.push({R,G,B});
        }
        this.paletteSize = newPaletteSize;
        this.#palette = newPalette;
        this.#notifyOnPaletteChanged();
    }

    getPalette(): ColorRGB[]{
        return this.#palette;
    }


    getColor(colorId: number) : ColorRGB | null{
        if(colorId >= this.paletteSize || colorId < 0) return null;
        const palette = this.getPalette();
        return palette[colorId] ?? null;
    }

    setCustomColor(colorId: number, newColor: ColorRGB){
        if(colorId >= this.paletteSize || colorId < 0) return;
        const oldColor = this.#palette[colorId];
        if(oldColor !== newColor ){
            this.#notifyOnPaletteChanged();
        }
        this.#palette[colorId] = newColor;       
    }

    // Searches the palette for specified color
    // returns id of the first cell with the color or null if none is found
    findIdByColor(c: ColorRGB): number | null{        
        this.#palette.forEach((v,i)=>{
            if(v.R === c.R && v.G === c.G && v.B === c.B){
                return i;
            }
        });
        return null;
    }
}