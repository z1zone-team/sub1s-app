# SVG 에셋

화면에 쓰는 그림을 `.svg` 파일로 두고 컴포넌트처럼 불러온다 (`react-native-svg-transformer`).

```tsx
import Ghost from "@assets/svg/ghost-profile.svg";

<Ghost width={56} height={56} />
```

- 파일의 `viewBox`만 맞으면 `width`, `height`로 크기를 정한다. 파일 안에 `width`, `height`는 두지 않는다
- 색은 파일에 직접 둔다(캐릭터는 다크 모드에서도 같은 색). 테마 색을 따라야 하는 그림은 `currentColor`로 쓰고 `color` 속성을 넘긴다
- 디자이너가 넘긴 SVG를 그대로 넣으면 된다. 새 그림을 넣거나 바꾼 뒤에는 Metro를 `--clear`로 다시 띄운다
- 지도 WebView 안의 HTML 문자열(`src/features/map/mapHtml.ts`)은 파일로 불러올 수 없어 거기만 경로를 따로 둔다
- 테스트(jest)에서는 `jest.svg-mock.js`가 빈 컴포넌트로 대신한다
