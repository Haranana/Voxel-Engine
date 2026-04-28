import { createContext } from "react";
import { EditorController } from "./EditorController";

export const ControllerContext = createContext<EditorController | null>(null);