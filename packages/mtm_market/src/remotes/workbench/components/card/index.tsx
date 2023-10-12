import InternalCard from './Card';
import Grid from './Grid';

type InternalCardType = typeof InternalCard;

export interface CardInterface extends InternalCardType {
  Grid: typeof Grid;
}

const Card = InternalCard as CardInterface;

Card.Grid = Grid;

export default Card;
