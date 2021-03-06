import { Request, Response } from "express";
import { TrackEvent } from "./orm";
import { bus } from "../lib/bus";

export async function track(req: Request, res: Response) {
  // parsing input
  const param = req.body;
  if (
    !param.rider_id ||
    !param.north ||
    !param.west ||
    !param.east ||
    !param.south
  ) {
    res.status(400).json({
      ok: false,
      error: "parameter tidak lengkap"
    });
    return;
  }
  const rider_id = param.rider_id;
  const north = parseFloat(param.north);
  const west = parseFloat(param.west);
  const east = parseFloat(param.east);
  const south = parseFloat(param.south);

  // save tracking movement
  const track = new TrackEvent({
    rider_id,
    north,
    west,
    east,
    south
  });
  try {
    await track.save();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "gagal menyimpan data"
    });
    return;
  }

  bus.publish("rider.moved", {
    rider_id,
    north,
    west,
    east,
    south
  });

  // encode output
  res.json({
    ok: true
  });
}

export async function getMovementLogs(req: Request, res: Response) {
  const rider_id = req.params.rider_id;
  if (!rider_id) {
    res.status(400).json({
      ok: false,
      error: "parameter tidak lengkap"
    });
    return;
  }

  // get rider movement logs
  let events = [];
  try {
    events = await TrackEvent.findAll({
      where: { rider_id },
      raw: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "gagal menyimpan data"
    });
    return;
  }

  // encode output
  res.json({
    ok: true,
    logs: events.map((e: any) => ({
      time: e.createdAt,
      east: e.east,
      west: e.west,
      north: e.north,
      south: e.south
    }))
  });
}
