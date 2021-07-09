$fn = 300; // resolution

diameters = ##diameters##;
strap_width = ##strap_width##;

strap_margin = ##strap_margin##;
cone_slope = ##cone_slope##;
cone_spike_height = ##cone_spike_height##;

max_cap_diameter = diameters[len(diameters) - 1];
wall_radius = diameters[len(diameters) - 1] / 2 + 2 + cone_slope;


// base part
difference() {
  cylinder(4, wall_radius, wall_radius, true);
  difference() {
    cylinder(4, diameters[0] / 2 - 4, diameters[0] / 2 - 4, true);
    cube([max_cap_diameter + 14 + strap_margin, strap_width + 6, 4], true);
  }
  translate([0, 0, -1]) cube([max_cap_diameter + 8 + strap_margin, strap_width, 2], true);
}

// strap holder
difference() {
  cube([max_cap_diameter + 14 + strap_margin, strap_width + 6, 4], true);
  cube([max_cap_diameter + 8 + strap_margin, strap_width, 4], true);
}

// lens cap holders
for(i = [0 : len(diameters) - 1]) {
  translate([0, 0, 2 + 2.5 * i]) {
    difference() {
      cylinder(2.5, wall_radius, wall_radius);
      cylinder(cone_spike_height, diameters[i] / 2 + cone_slope, diameters[i] / 2);
      translate([0, 0, cone_spike_height]) cylinder(2.5 - cone_spike_height, diameters[i] / 2, diameters[i] / 2 + cone_slope);
    }
  }
}
