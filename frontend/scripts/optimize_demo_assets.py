"""Genera las mallas ligeras (STL/PLY binarios) que usa la demo /demo.

Uso (python con pyvista):
    python scripts/optimize_demo_assets.py <carpeta_demo_completo> <salida>

<carpeta_demo_completo> contiene 1_ply/ y 3_stl_protesis/.
<salida> normalmente es public/demo.
Los originales no se modifican: aqui solo se convierten a binario y se decimanan
las mallas muy densas para que el navegador las cargue rapido.
"""
import sys
from pathlib import Path

import pyvista as pv

# archivo -> fraccion de triangulos a eliminar (0 = solo convertir a binario)
STL_REDUCTION = {"handMesh.stl": 0.5}
PLY_FILES = {
    "hand_partialHand1.ply": 0.0,
    "scan_COLMAP_denso_nube_de_puntos.ply": 0.0,
    "scan_COLMAP_poisson.ply": 0.75,
}


def save_stl(mesh: pv.PolyData, dest: Path) -> None:
    mesh.save(str(dest), binary=True)


def save_ply(mesh: pv.PolyData, dest: Path) -> None:
    rgb = mesh.point_data.get("RGB")
    mesh.clear_data()
    if rgb is not None:
        mesh.save(str(dest), binary=True, texture=rgb)
    else:
        mesh.save(str(dest), binary=True)


def main() -> int:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    (out / "stl").mkdir(parents=True, exist_ok=True)
    (out / "ply").mkdir(parents=True, exist_ok=True)

    for stl in sorted((src / "3_stl_protesis").glob("*.stl")):
        mesh = pv.read(str(stl)).triangulate()
        cut = STL_REDUCTION.get(stl.name, 0.0)
        if cut:
            mesh = mesh.decimate_pro(cut, preserve_topology=True)
        save_stl(mesh, out / "stl" / stl.name)
        print(f"stl {stl.name}: {mesh.n_cells} tri")

    for name, cut in PLY_FILES.items():
        mesh = pv.read(str(src / "1_ply" / name))
        if mesh.n_cells and not mesh.is_all_triangles:
            mesh = mesh.triangulate()
        if cut:
            mesh = mesh.decimate_pro(cut, preserve_topology=True)
        save_ply(mesh, out / "ply" / name)
        print(f"ply {name}: {mesh.n_points} v / {mesh.n_cells} celdas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
