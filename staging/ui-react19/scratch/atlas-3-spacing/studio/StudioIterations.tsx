import { useState } from 'react';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '../../../dist/index.js';
import { Studio } from './Studio';
import { IterationTwo } from './iter2/IterationTwo';
import { IterationThree } from './iter3/IterationThree';
import { IterationFour } from './iter4/IterationFour';
import { IterationFive } from './iter5/IterationFive';

export function StudioIterations() {
  const [iteration, setIteration] = useState(() => {
    const requested = new URLSearchParams(location.search).get('iteration');
    return requested === 'iter2' || requested === 'iter3' || requested === 'iter4' || requested === 'iter5' ? requested : 'iter1';
  });
  return <TabsRoot value={iteration} onValueChange={value => {
    setIteration(value);
    const url = new URL(location.href); url.searchParams.set('iteration', value); url.hash = '';
    history.replaceState(null, '', url);
  }}>
    <TabsList aria-label="Studio iterations"><TabsTrigger value="iter1">Iter 1</TabsTrigger><TabsTrigger value="iter2">Iter 2</TabsTrigger><TabsTrigger value="iter3">Iter 3</TabsTrigger><TabsTrigger value="iter4">Iter 4</TabsTrigger><TabsTrigger value="iter5">Iter 5 · Packaged</TabsTrigger></TabsList>
    <TabsContent value="iter1"><Studio /></TabsContent>
    <TabsContent value="iter2"><IterationTwo /></TabsContent>
    <TabsContent value="iter3"><IterationThree /></TabsContent>
    <TabsContent value="iter4"><IterationFour /></TabsContent>
    <TabsContent value="iter5"><IterationFive /></TabsContent>
  </TabsRoot>;
}
