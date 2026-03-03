import type { Section } from '../types'

export const INITIAL_SECTIONS: Section[] = [
  {
    id: 's1',
    name: 'BBQ with Mark',
    collapsed: false,
    suggestPhase: 'idle',
    activeView: 'flat',
    suggestResult: null,
    dismissedIds: [],
    keptIds: [],
    moreShown: false,
    selectedChips: {},
    items: [
      { id: 'i1', nameEn: 'Tofu',          nameSecondary: '豆腐',    quantity: 1, checked: false },
      { id: 'i2', nameEn: 'Pork Belly',    nameSecondary: '五花肉',  quantity: 1, checked: false },
      { id: 'i3', nameEn: 'Kimchi',         nameSecondary: '泡菜',    quantity: 1, checked: false },
      { id: 'i4', nameEn: 'Seaweed',        nameSecondary: '海苔',    quantity: 1, checked: false },
      { id: 'i5', nameEn: 'Burger Patties', nameSecondary: '汉堡肉饼',quantity: 1, checked: false },
      { id: 'i6', nameEn: 'Hot Dog Buns',   nameSecondary: '热狗面包',quantity: 1, checked: false },
      { id: 'i7', nameEn: 'Hot Dogs',       nameSecondary: '热狗',    quantity: 1, checked: false },
      { id: 'i8', nameEn: 'Mustard',        nameSecondary: '芥末酱',  quantity: 1, checked: false },
    ],
  },
]

let _nextId = 100
export function genId() { return `id-${_nextId++}` }
