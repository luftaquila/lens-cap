$fn = 300; // resolution

diameters = [58, 82];
strap = 11;

max_cap_diameter = diameters[len(diameters) - 1];
wall_radius = diameters[len(diameters) - 1] / 2 + 4;

// base
difference() {
  cylinder(4, wall_radius, wall_radius, true);
  difference() {
    cylinder(4, diameters[0] / 2 - 4, diameters[0] / 2 - 4, true);
    cube([max_cap_diameter + 18, strap + 6, 4], true);
  }
  translate([0, 0, -1]) {
    cube([max_cap_diameter + 12, strap, 2], true);
  }
}

// strap holder
difference() {
  cube([max_cap_diameter + 18, strap + 6, 4], true);
  cube([max_cap_diameter + 12, strap, 4], true);
}

// lens cap holders
for(i = [1 : len(diameters)]) {
  target_cap_diameter = diameters[i - 1];
  translate([0, 0, 2 * i]) {
    difference() {
      cylinder(2.5, wall_radius, wall_radius);
      cylinder(1.2, target_cap_diameter / 2 + 2, target_cap_diameter / 2);
      translate([0, 0, 1.2]) {
        cylinder(1.3, target_cap_diameter / 2, target_cap_diameter / 2 + 2);
      }
    }
  }
}
