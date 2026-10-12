// 카카오 로컬 API - 카테고리로 장소 검색 (FD6 = 음식점)
// 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide
// 주의: 카카오 운영정책상 검색 결과를 DB에 저장하거나 쿼터 절약용으로 캐싱하면 안 됨 → 매번 실시간 호출

const BASE = 'https://dapi.kakao.com/v2/local/search/category.json';

export async function searchRestaurants({ lat, lng, radius }) {
  const key = process.env.KAKAO_REST_API_KEY;
  const all = [];

  // 한 페이지 최대 15개 → 최대 3페이지(45개)까지 가져옴
  for (let page = 1; page <= 3; page++) {
    const params = new URLSearchParams({
      category_group_code: 'FD6', // 음식점
      x: String(lng), // 경도
      y: String(lat), // 위도
      radius: String(radius), // 반경(m), 최대 20000
      sort: 'distance', // 거리순
      size: '15',
      page: String(page),
    });

    const res = await fetch(`${BASE}?${params}`, {
      headers: { Authorization: `KakaoAK ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`카카오 로컬 API 오류 (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    all.push(...json.documents);
    if (json.meta.is_end) break;
  }

  return all.map((d) => ({
    id: d.id,
    name: d.place_name,
    category: d.category_name, // 예: "음식점 > 한식 > 국밥"
    address: d.road_address_name || d.address_name,
    jibun: d.address_name,
    phone: d.phone,
    url: d.place_url,
    distance: Number(d.distance), // 검색 중심에서의 거리(m)
    lat: Number(d.y),
    lng: Number(d.x),
  }));
}
