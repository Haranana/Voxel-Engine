# WebGPU based Voxel Editor (Work in Progress)
## Description

A web-based 3D voxel editor with scene composition and ray tracing-based rendering, built using WebGPU and React.

## Planned Features

### Voxel Model Editing

- Create voxel grids with custom dimensions  
- Add, remove, paint, move, scale, rotate, and mirror voxels or entire objects  
- Select voxels using multiple methods:
  - single voxel  
  - box selection  
  - face selection  
  - group selection  
  - color-based selection  
- Customize the editor view:
  - toggle grid  
  - enable/disable simple shading and shadows  
- Create and manage multiple voxel models within a project  
- Create, switch, and import color palettes  

---

### Import / Export

- Import and export voxel models in `.vox` format  
- Export generated meshes to:
  - `.obj`  
  - `.gltf`  

---

### Scene Editor

- Build scenes with meshes from modeled voxel objects 
- Apply basic 3D transformations
- Organize objects using:
  - layers  
  - hierarchical groups  
- Add and configure entities for use in render mode:
  - cameras  
  - light sources  
- Assign basic materials to objects  

---

### Rendering

- rendering based on ray-tracing  
- Support for lighting, shadows, and materials  
- Material parameters:
  - emission  
  - metalness  
  - roughness  
- Rendering parameters:
  - sample count  
  - maximum ray bounces  
  - light intensity and color  
