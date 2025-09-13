$fn = 200; // resolution

// -------- parameters --------
diameters = [];
strap_width = 11.5;

strap_margin = 10;
cone_slope = 2;
cone_spike_height = 1.6;

max_cap_diameter = diameters[len(diameters) - 1];
wall_radius = diameters[len(diameters) - 1] / 2 + 2 + cone_slope;

fillet = 1.5;

// -------- fillet helpers --------
module rounded_cube(size, r, center=true) {
  minkowski(){
    cube(size - [2 * r, 2 * r, 2 * r], center=center);
    sphere(r=r, $fn=$fn);
  }
}

// internal full-rounded cylinder
module _rcyl(h, r1, r2, fillet, center=true) {
  minkowski(){
    cylinder(h - 2 * fillet, r1 - fillet, r2 - fillet, center=center);
    sphere(fillet, $fn=$fn);
  }
}

// clip helpers: keep z >= thresh
module _z_clip_ge(thresh, box) {
  translate([0, 0, (thresh + box) / 2]) cube([box, box, box], center=true);
}

// keep z <= thresh
module _z_clip_le(thresh, box) {
  translate([0, 0, (thresh - box) / 2]) cube([box, box, box], center=true);
}

/* which: "all" | "bottom" | "top"
   center: matches OpenSCAD cylinder center */
module rounded_cylinder_select(h, r1, r2, fillet, which="all", center=true) {
  box = max(r1, r2) * 4 + h * 4 + 10;

  if (which == "all") {
    _rcyl(h, r1, r2, fillet, center=center);
  } else if (which == "bottom") {
    z0 = center ? (-h / 2 + fillet) : (0 + fillet);

    union(){
      intersection() {
        _rcyl(h, r1, r2, fillet, center=center);
        _z_clip_le(z0, box);
      }

      intersection() {
        cylinder(h, r1, r2, center=center);
        _z_clip_ge(z0, box);
      }
    }
  } else if (which == "top") {
    z1 = center ? ( h / 2 - fillet) : (h - fillet);

    union(){
      intersection() {
        _rcyl(h, r1, r2, fillet, center=center);
        _z_clip_ge(z1, box);
      }

      intersection() {
        cylinder(h, r1, r2, center=center);
        _z_clip_le(z1, box);
      }
    }
  }
}

// -------- model --------

// base part
difference() {
  rounded_cylinder_select(4, wall_radius, wall_radius, fillet, which="bottom", center=true);

  difference() {
    cylinder(4, diameters[0] / 2 - 4, diameters[0] / 2 - 4, true);
    cube([max_cap_diameter + 14 + strap_margin, strap_width + 6, 4], true);
  }

  translate([0, 0, -1]) cube([max_cap_diameter + 8 + strap_margin, strap_width, 2], true);
}

// strap holder
difference() {
  rounded_cube([max_cap_diameter + 14 + strap_margin, strap_width + 6, 4], fillet, true);
  rounded_cube([max_cap_diameter + 8 + strap_margin, strap_width, 4], fillet, true);
}

// lens cap holders
for (i = [0 : len(diameters) - 1]) {
  translate([0, 0, 2 + 2.5 * i]) {
    difference() {
      if (i == len(diameters) - 1)
        rounded_cylinder_select(2.5, wall_radius, wall_radius, fillet, which="top", center=false);
      else
        cylinder(2.5, wall_radius, wall_radius);

      cylinder(cone_spike_height, diameters[i] / 2 + cone_slope, diameters[i] / 2);
      translate([0, 0, cone_spike_height]) cylinder(2.5 - cone_spike_height, diameters[i] / 2, diameters[i] / 2 + cone_slope);
    }
  }
}

