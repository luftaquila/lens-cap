$fn = 300; // resolution

diameters = [58, 82];
strap = 11;

cone_slope = 2;
cone_spike_height = 1.6;
strap_margin = 10;

max_cap_diameter = diameters[len(diameters) - 1];
wall_radius = diameters[len(diameters) - 1] / 2 + 2 + cone_slope;


// base
difference() {
  cylinder(4, wall_radius, wall_radius, true);
  difference() {
    cylinder(4, diameters[0] / 2 - 4, diameters[0] / 2 - 4, true);
    cube([max_cap_diameter + 14 + strap_margin, strap + 6, 4], true);
  }
  translate([0, 0, -1]) cube([max_cap_diameter + 8 + strap_margin, strap, 2], true);
}

// strap holder
difference() {
  cube([max_cap_diameter + 14 + strap_margin, strap + 6, 4], true);
  cube([max_cap_diameter + 8 + strap_margin, strap, 4], true);
}

// lens cap holders
for(i = [1 : len(diameters)]) {
  target_cap_diameter = diameters[i - 1];
  translate([0, 0, 2 * i]) {
    difference() {
      cylinder(2.5, wall_radius, wall_radius);
      cylinder(cone_spike_height, target_cap_diameter / 2 + cone_slope, target_cap_diameter / 2);
      translate([0, 0, cone_spike_height]) cylinder(2.5 - cone_spike_height, target_cap_diameter / 2, target_cap_diameter / 2 + cone_slope);
    }
  }
}
