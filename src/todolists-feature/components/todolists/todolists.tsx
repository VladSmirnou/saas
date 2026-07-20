import { use } from 'react';
import { Todolist } from './todolist/todolist';
import type { TodolistsProps } from './types';

export const Todolists = ({ todolistsPromise }: TodolistsProps) => {
  const todolists = use(todolistsPromise);

  console.log(todolists);

  let content;
  if (!todolists.length) {
    content = <p>No todolists yet</p>;
  } else {
    content = todolists.map((todolist) => (
      <Todolist key={todolist.id} todolist={todolist} />
    ));
  }
  return <div>{content}</div>;
};
