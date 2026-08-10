"""Quick smoke test for the constraint layout solver."""

from app.models.layout import RoomSpec
from app.services.layout_engine import (
    arrange_rooms,
    build_doors_and_adjacency,
    place_furniture,
    place_windows,
)


def main() -> None:
    rooms = [
        RoomSpec(type="bedroom", width=3.5, length=4, label="Bedroom 1"),
        RoomSpec(type="bedroom", width=3.5, length=4, label="Bedroom 2"),
        RoomSpec(type="kitchen", width=3, length=2.5),
        RoomSpec(type="bathroom", width=2, length=2.5),
    ]
    placed = arrange_rooms(rooms)
    doors, adj = build_doors_and_adjacency(placed)
    furn = place_furniture(placed)
    wins = place_windows(placed, doors)

    print("rooms:")
    for r in placed:
        print(f"  {r.type:10} {r.label:12} x={r.x:+.3f} z={r.z:+.3f}  {r.width}x{r.length}")
    print(f"doors: {len(doors)}")
    for d in doors:
        print(" ", d.model_dump(by_alias=True))
    print(f"adjacency: {len(adj)}  furniture: {len(furn)}  windows: {len(wins)}")
    assert len(doors) >= 3, f"expected >=3 doors, got {len(doors)}"
    bedroom_ids = {r.id for r in placed if r.type == "bedroom"}
    hall_ids = {r.id for r in placed if r.type in {"hall", "living"}}
    connected = set()
    for d in doors:
        payload = d.model_dump(by_alias=True)
        a, b = payload["from"], payload["to"]
        if a in bedroom_ids and b in hall_ids:
            connected.add(a)
        if b in bedroom_ids and a in hall_ids:
            connected.add(b)
    assert bedroom_ids <= connected, f"bedrooms not linked to hall: {bedroom_ids - connected}"
    print("OK")


if __name__ == "__main__":
    main()
