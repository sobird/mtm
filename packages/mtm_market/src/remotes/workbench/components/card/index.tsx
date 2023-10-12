import InternalCard from './Card';
import Grid from './Grid';
import View from './View';

type InternalCardType = typeof InternalCard;

export interface CardInterface extends InternalCardType {
  Grid: typeof Grid;
  View: typeof View;
}

const Card = InternalCard as CardInterface;

Card.Grid = Grid;
Card.View = View;

export default Card;
