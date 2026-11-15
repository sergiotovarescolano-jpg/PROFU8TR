import { Fragment, type ReactNode } from 'react'

/** Permite partir la línea tras cada "/" ("ESPALDA/BICEPS"), en vez de cortar la palabra por la mitad. */
export function breakAtSlashes(text: string): ReactNode {
  const parts = text.split('/')
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <>
          /<wbr />
        </>
      )}
    </Fragment>
  ))
}
