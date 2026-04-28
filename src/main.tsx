import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import EditorPage from "./EditorPage";
import './index.css'
import { EditorController } from "./EditorController";
import { ControllerContext } from "./ControllerContext";

const controller = new EditorController(); 

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ControllerContext.Provider value={controller}>
      <EditorPage />
    </ControllerContext.Provider>
  </StrictMode>
);