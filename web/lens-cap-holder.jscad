function main(){   return CSG.cylinder({start: [0,0,-2], end: [0,0,2],radiusStart: 45, radiusEnd: 45, resolution: 300}).subtract([CSG.cylinder({start: [0,0,-2], end: [0,0,2],radiusStart: 25, radiusEnd: 25, resolution: 300}).subtract([CSG.cube({center: [0,0,0],radius: [53,9,2], resolution: 16})]), CSG.cube({center: [0,0,0],radius: [50,6,1], resolution: 16}).translate([0,0,-1])]).union([CSG.cube({center: [0,0,0],radius: [53,9,2], resolution: 16}).subtract([CSG.cube({center: [0,0,0],radius: [50,6,2], resolution: 16})]),CSG.cylinder({start: [0,0,0], end: [0,0,2.5],radiusStart: 45, radiusEnd: 45, resolution: 300}).subtract([CSG.cylinder({start: [0,0,0], end: [0,0,1.6],radiusStart: 31, radiusEnd: 29, resolution: 300}), CSG.cylinder({start: [0,0,0], end: [0,0,0.8999999999999999],radiusStart: 29, radiusEnd: 31, resolution: 300}).translate([0,0,1.6])]).translate([0,0,2]).union([CSG.cylinder({start: [0,0,0], end: [0,0,2.5],radiusStart: 45, radiusEnd: 45, resolution: 300}).subtract([CSG.cylinder({start: [0,0,0], end: [0,0,1.6],radiusStart: 43, radiusEnd: 41, resolution: 300}), CSG.cylinder({start: [0,0,0], end: [0,0,0.8999999999999999],radiusStart: 41, radiusEnd: 43, resolution: 300}).translate([0,0,1.6])]).translate([0,0,4.5])])]); };
