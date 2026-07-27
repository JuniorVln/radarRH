import type { Page, Locator } from '@playwright/test'

// Nas telas do sistema o padrao e <div><label>Rotulo</label><input/></div> — label
// irmao do campo, sem for/id. Nas paginas criticas eu associei label+id de verdade;
// nas demais, associar tudo daria um diff enorme sem necessidade, entao aqui a gente
// localiza pelo irmao imediato do label.
//
// Se um dia os labels forem todos associados, `page.getByLabel()` passa a funcionar e
// este helper pode sumir.
export function campo(page: Page, rotulo: string): Locator {
  const alvo = `label:text-is("${rotulo}")`
  return page.locator(`${alvo} + input, ${alvo} + select, ${alvo} + textarea`)
}
