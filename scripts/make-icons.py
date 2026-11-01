#!/usr/bin/env python3
from pathlib import Path
import struct
import zlib
ROOT = Path(__file__).resolve().parent.parent
POINTS = [(115,265),(175,265),(215,216),(240,337),(275,170),(301,265),(399,265)]
def distance(px,py,ax,ay,bx,by):
    dx,dy=bx-ax,by-ay
    t=max(0.,min(1.,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)))
    return ((px-(ax+t*dx))**2+(py-(ay+t*dy))**2)**.5
def chunk(typ,payload):
    return struct.pack('!I',len(payload))+typ+payload+struct.pack('!I',zlib.crc32(typ+payload)&0xffffffff)
def png(size,maskable=False):
    scan=bytearray()
    for y in range(size):
        scan.append(0)
        v=(y+0.5)*512/size
        for x in range(size):
            u=(x+0.5)*512/size
            card=(68<=u<=444 and 68<=v<=444) if maskable else (22<=u<=490 and 22<=v<=490)
            color=(24,16,35) if card else (10,10,12)
            for (ax,ay),(bx,by) in zip(POINTS,POINTS[1:]):
                if distance(u,v,ax,ay,bx,by)<8.5:
                    color=(171,93,245)
                    break
            scan.extend((*color,255))
    header=struct.pack('!2I5B',size,size,8,6,0,0,0)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',header)+chunk(b'IDAT',zlib.compress(bytes(scan),9))+chunk(b'IEND',b'')
icons=ROOT/'public/icons'
icons.mkdir(parents=True,exist_ok=True)
for name,size,maskable in [('icon-192.png',192,False),('icon-512.png',512,False),('maskable-512.png',512,True)]:
    (icons/name).write_bytes(png(size,maskable))
(ROOT/'public/apple-touch-icon.png').write_bytes(png(180))
print('Generated Pulse Lab icons')
