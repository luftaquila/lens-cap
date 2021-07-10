let gProcessor = null;

// Show all exceptions to the user
OpenJsCad.AlertUserOfUncaughtExceptions();

gProcessor = new OpenJsCad.Processor(document.getElementById("viewer"));

/* slimselect initialize */
const select = new SlimSelect({
  select: '#diameters',
  placeholder: translator('diameter_select_placeholder'),
  addable: function(value) {
    if(!Number(value)) return Swal.fire({ icon: 'error', title: translator('invalid_diameter_title'), text: translator('invalid_diameter_text') });
    return { text: value + 'mm', value: Number(value) }
  },
  data: [
    { text: '37mm', value: 37 },
    { text: '39mm', value: 39 },
    { text: '40mm', value: 40 },
    { text: '40.5mm', value: 40.5 },
    { text: '43mm', value: 43 },
    { text: '46mm', value: 46 },
    { text: '49mm', value: 49 },
    { text: '52mm', value: 52 },
    { text: '55mm', value: 55 },
    { text: '58mm', value: 58 },
    { text: '60mm', value: 60 },
    { text: '62mm', value: 62 },
    { text: '67mm', value: 67 },
    { text: '72mm', value: 72 },
    { text: '77mm', value: 77 },
    { text: '82mm', value: 82 },
    { text: '86mm', value: 86 },
    { text: '95mm', value: 95 },
  ]
});

$('#generate').click(() => {
  const diameters = select.selected().map(x => Number(x)).sort((a, b) => (a - b));
  const strap_width = $('#strap_width').val();
  const strap_margin = $('#strap_margin').val();
  const cone_slope = $('#cone_slope').val();
  const cone_spike_height = $('#cone_spike_height').val();

  if(!diameters.length) return Swal.fire({ icon: 'error', title: translator('invalid_option_title'), text: translator('invalid_option_diameters') });
  if(!strap_width) return Swal.fire({ icon: 'error', title: translator('invalid_option_title'), text: translator('invalid_option_strap_width') });
  if(!strap_margin) return Swal.fire({ icon: 'error', title: translator('invalid_option_title'), text: translator('invalid_option_strap_margin') });
  if(!cone_slope) return Swal.fire({ icon: 'error', title: translator('invalid_option_title'), text: translator('invalid_option_cone_slope') });
  if(!cone_spike_height) return Swal.fire({ icon: 'error', title: translator('invalid_option_title'), text: translator('invalid_option_cone_spike_height') });

  $.get('lens-cap-holder.scad', function(data) {
    data = data
            .replace('##diameters##', JSON.stringify(diameters))
            .replace('##strap_width##', strap_width)
            .replace('##strap_margin##', strap_margin)
            .replace('##cone_slope##', cone_slope)
            .replace('##cone_spike_height##', cone_spike_height);
    $('#scad-code').val(data);
    $('#code').val(openscadOpenJscadParser.parse(data));
    gProcessor.setJsCad($('#code').val());
  });
});

$('#toggle-advanced').click(() => {
  if($('#advanced').css('display') === 'none') {
    $('#advanced').css('display', 'block');
    $('#toggle-advanced').text(translator('advanced_open'));
  }
  else {
    $('#advanced').css('display', 'none');
    $('#toggle-advanced').text(translator('advanced_close'));
  }
});

$('img.example-photo').click(function() {
  Swal.fire({ html: `<img style="width: 100%" src="${$(this).attr('src')}">`, customClass: 'wide-modal' });
});


$('#tooltip_diameter').click(() => Swal.fire({ icon: 'info', title: translator('tooltip_diameter_title'), html: translator('tooltip_diameter_text'), customClass: 'medium-modal' }));
$('#tooltip_strap_width').click(() => Swal.fire({ icon: 'info', title: translator('tooltip_strap_width_title'), html: translator('tooltip_strap_width_text'), customClass: 'medium-modal' }));
$('#tooltip_strap_margin').click(() => Swal.fire({ icon: 'info', title: translator('tooltip_strap_margin_title'), html: translator('tooltip_strap_margin_text'), customClass: 'medium-modal' }));
$('#tooltip_cone_slope').click(() => Swal.fire({ icon: 'info', title: translator('tooltip_cone_slope_title'), html: translator('tooltip_cone_slope_text'), customClass: 'medium-modal' }));
$('#tooltip_cone_spike_height').click(() => Swal.fire({ icon: 'info', title: translator('tooltip_cone_spike_height_title'), html: translator('tooltip_cone_spike_height_text'), customClass: 'medium-modal' }));
$('#tooltip_support').click(() => Swal.fire({ icon: 'info', title: translator('tooltip_support_title'), html: translator('tooltip_support_text'), customClass: 'medium-modal' }));

function translator(value) {
  const isKorean = $('html').attr('lang') === 'ko';
  switch (value) {
    case 'diameter_select_placeholder': return isKorean ? '렌즈 캡 직경을 모두 선택하세요.' : 'Your all lens cap diameters here';
    case 'invalid_diameter_title': return isKorean ? '올바른 렌즈 캡 크기가 아닙니다.' : 'Invalid lens cap diameter.';
    case 'invalid_diameter_text': return isKorean ?  '"mm"를 제외한 숫자만 입력하세요.' : 'Do not include "mm" here. This accepts numbers only.';
    case 'invalid_option_title': return isKorean ? '비어있는 옵션이 있습니다.' : 'Empty option field present.';
    case 'invalid_option_diameters': return isKorean ? '렌즈 캡 직경을 입력하세요.' : 'Please enter lens cap diameters.';
    case 'invalid_option_strap_width': return isKorean ? '스트랩 폭을 입력하세요.' : 'Please enter strap width.';
    case 'invalid_option_strap_margin': return isKorean ? '스트랩 홀더 길이를 입력하세요.' : 'Please enter strap margin.';
    case 'invalid_option_cone_slope': return isKorean ? '캡 홀더 경사를 입력하세요.' : 'Please enter cone slope.';
    case 'invalid_option_cone_spike_height': return isKorean ? '캡 홀더 홈 높이를 입력하세요.' : 'Please enter cone spike height.';

    case 'tooltip_diameter_title': return isKorean ? '렌즈 캡 직경' : 'Lens cap diameters';
    case 'tooltip_diameter_text': return isKorean ? '원하는 모든 렌즈 캡의 직경을 입력하세요. 렌즈 캡 직경은 렌즈에 맞는 필터의 구경과 같습니다.<br><br>원하는 직경이 목록에 없다면 검색창에 원하는 크기를 숫자만 입력한 후 옆의 +버튼을 누르세요.' : "Select all of your lenses' cap size. It is equal to your lenses' filter thread.<br><br>If there is no size you want, enter your size in search box and click + button next to search box.";
    case 'tooltip_strap_width_title': return isKorean ? '스트랩 너비' : 'Strap width';
    case 'tooltip_strap_width_text': return isKorean ? '<img src="images/strapWidth.png" style="width: 100%"><br><br>스트랩 너비는 사진에 표시된 부분의 길이를 말합니다. 일반적으로 11mm정도 됩니다.<br><br>출력된 실제 폭은 열수축으로 인해 설정된 값보다 작을 수 있으니 0.5mm정도 여유있게 설정하세요.<br><br>실제 출력된 너비가 스트랩보다 아주 살짝 작아야 홀더가 헐렁거리지 않고 잘 고정됩니다.' : '<img src="images/strapWidth.png" style="width: 100%"><br><br>Strap width means the width indicated in the picture. Standard size is 11mm or so, in general.<br><br>The actual width of printed model could be shorter than the setting due to heat shrink. Give some margin(0.5mm) to your value.<br><br>Holder will be fixed tightly on strap when printed width is slightly smaller than strap width.';
    case 'tooltip_strap_margin_title': return isKorean ? '스트랩 여유 길이' : 'Strap margin';
    case 'tooltip_strap_margin_text': return isKorean ? '<img src="images/strapMargin.png" style="width: 100%"><br><br>스트랩 여유 길이는 사진에 표시된 부분의 길이를 말합니다.<br>너무 짧으면 스트랩이 너무 꺾여 보기에 좋지 않을 수 있습니다.' : '<img src="images/strapMargin.png" style="width: 100%"><br><br>Strap margin means the length indicated in the picture.<br>It looks bad if the value is too short.';
    case 'tooltip_cone_slope_title': return isKorean ? '경사도' : 'Cone slope';
    case 'tooltip_cone_slope_text': return isKorean ? '<img src="images/spike.png" style="width: 100%"><br><br>경사도는 사진에 표시된 부분의 길이를 말합니다.<br>값이 커지면 그만큼 경사가 완만해지고 끝이 뾰족해집니다.<br><br>정확한 경사각을 알고 싶다면 탄젠트를 이용하세요.' : '<img src="images/spike.png" style="width: 100%"><br><br>Cone slope means the indicated length in the picture. Slope gets gentler and spike gets sharper as the value goes bigger.<br><br>You can use tangent-thing if you want to know the exact slope angle.';
    case 'tooltip_cone_spike_height_title': return isKorean ? '스파이크 높이' : 'Cone spike height';
    case 'tooltip_cone_spike_height_text': return isKorean ? '<img src="images/spike.png" style="width: 100%"><br><br>스파이크 높이는 사진에 표시된 것처럼,<br>렌즈 캡과 맞물리는 뾰족한 부분의 높이를 말합니다.<br><br>전체 높이가 2.5mm이므로, 이 값을 초과할 수 없습니다.' : '<img src="images/spike.png" style="width: 100%"><br><br>Cone spike height means the height of the spike coupled with the lens cap, as the picture indicates.<br><br>Value cannot be larger than 2.5mm, as the total height is 2.5mm.';
    case 'tooltip_support_title': return isKorean ? '서포트 생성' : 'Support generation';
    case 'tooltip_support_text': return isKorean ? '<img src="images/support.gif" style="width: 100%"><br><br>베드에 닿는 곳만 서포트를 생성하지 않고 모든 곳에 서포트를 생성하도록 하면 사진처럼 렌즈 캡을 잡아주는 부분의 아래쪽에 서포트(분홍색)가 생길 수 있습니다.<br><br>이렇게 되면 떼기 힘들 수 있으니 서포트가 없어도 잘 출력해줄거라고 3D프린터를 믿어봅시다.' : '<img src="images/support.gif" style="width: 100%"><br><br>Supports(pink parts at picture) could be generated at the bottom part of the cone holding the lens cap if setted as "Everywhere", not "Touching buildplate only".<br><br>These supports are usually hard to remove.<br>So just believe, your 3D printer can print it without support.';

    case 'advanced_close': return isKorean ? '고급 옵션 열기' : 'Advanced options...';
    case 'advanced_open': return isKorean ? '고급 옵션 닫기' : 'Close advanced options';
  }
}
