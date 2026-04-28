import * as THREE from 'three';

export function getSnappedPosition(point: THREE.Vector3, normal: THREE.Vector3, width: number, depth: number, height: number, rotation: number) {
    // Determine effective width/depth based on rotation
    const isRotated = Math.abs(rotation % Math.PI) > 0.1;
    const w = isRotated ? depth : width;
    const d = isRotated ? width : depth;

    // Use point + normal offset to find which grid cell in XZ we are targeting
    const p = point.clone().add(normal.clone().multiplyScalar(0.1));
    
    // Snap X and Z based on whether dimensions are even or odd.
    // Even dimensions snap to integer centers. Odd dimensions snap to half-integer centers.
    const cx = (w % 2 === 0) ? Math.round(p.x) : Math.floor(p.x) + 0.5;
    const cz = (d % 2 === 0) ? Math.round(p.z) : Math.floor(p.z) + 0.5;

    // Y snapping based on face normal
    let y = 0;
    
    // Snap the intersection point to nearest plate height (0.4) to find the boundary we hit
    // If it hit a stud (1.4), it rounds to 1.2 (brick surface) if we use Math.round on the face or floor on point below
    const hitYLevel = Math.round((point.y - (normal.y > 0 ? 0.2 : 0)) / 0.4) * 0.4;
    
    if (normal.y > 0.5) {
        // Placing on top
        y = hitYLevel;
    } else if (normal.y < -0.5) {
        // Placing underneath
        y = hitYLevel - height;
    } else {
        // Placing sideways. Match the bottom Y of the block we hit
        // Snap to nearest 0.4 plate level
        y = Math.floor((point.y) / 0.4) * 0.4; 
    }

    y = Math.max(0, y);

    const cy = y + height / 2.0;

    return [cx, cy, cz];
}
