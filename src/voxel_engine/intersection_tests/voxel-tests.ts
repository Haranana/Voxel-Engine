import type { Plane } from "../../math/geometry/plane"
import type { Ray } from "../../math/geometry/ray";
import type { Vector3 } from "../../math/vector3.type"

export type IntersectionResult = "outside" | "inside" | "intersecting"

/*
    Assumes that normal is in direction opposite to the box
    If test is used for FrustumAABB Intersection then normals should point outside of the frustum
*/
export function planeAABBIntersection(boxMinVertex: Vector3, boxMaxVertex: Vector3, plane: Plane) : IntersectionResult{
    const c: Vector3 = (boxMaxVertex.addVector(boxMinVertex)).multByScalar(0.5);
    const h: Vector3 = (boxMaxVertex.subVector(boxMinVertex)).multByScalar(0.5);

    const absN = plane.getNormal();
    absN.x = Math.abs(absN.x);
    absN.y = Math.abs(absN.y);
    absN.z = Math.abs(absN.z);

    const e = h.dotProduct(absN);
    const s = plane.distanceTo(c);
    
    if(s-e>0){
        return "outside"
    }else if(s+e<0){
        return "inside"
    }else{
        return "intersecting"
    }
}

export function planeRayIntersection(ray: Ray, plane: Plane): Vector3 | null{
    if(Math.abs(plane.getNormal().dotProduct(ray.direction)) < 1e-6){
        return null;
    }else{        
        const d = -plane.getNormal().dotProduct(plane.getPoint())
        const t =  -(plane.getNormal().dotProduct(ray.origin)+d) / (plane.getNormal().dotProduct(ray.direction));  
        return ray.get(t)
    }
}