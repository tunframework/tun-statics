import { TunContext } from "tun";
import type { TunComposable } from "tun";
export default function statics({ getMIME, dir, prefix, }: {
    getMIME?: ((pathname: string) => undefined) | undefined;
    dir?: string | undefined;
    prefix?: string | undefined;
}): TunComposable<TunContext>;
