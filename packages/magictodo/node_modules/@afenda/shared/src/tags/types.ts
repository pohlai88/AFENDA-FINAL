/**
 * Shared Tags Infrastructure
 * Generic tagging pattern for cross-domain use
 * 
 * @example
 * import { Taggable, TagService } from "@afenda/shared/tags";
 */

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt?: string;
}

/** Input for creating a tag (id is set by the service) */
export type CreateTagInput = Omit<Tag, "id">;

/** Input for updating a tag (partial) */
export type UpdateTagInput = Partial<Tag>;

/**
 * Interface for entities that can be tagged
 */
export interface Taggable {
  id: string;
  tags?: Tag[];
}

/**
 * Generic tag service interface
 * Each domain implements this for their entities
 */
export interface TagService<T extends Taggable> {
  /**
   * Add a tag to an entity
   */
  addTag(entityId: string, tagId: string): Promise<T>;
  
  /**
   * Remove a tag from an entity
   */
  removeTag(entityId: string, tagId: string): Promise<T>;
  
  /**
   * List all available tags
   */
  listTags(): Promise<Tag[]>;
  
  /**
   * Create a new tag
   */
  createTag(tag: Omit<Tag, "id">): Promise<Tag>;
  
  /**
   * Delete a tag
   */
  deleteTag(tagId: string): Promise<void>;
}

/**
 * Tag picker props for pure UI component
 */
export interface TagPickerProps<T extends Taggable> {
  entity: T;
  availableTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag?: (tag: Omit<Tag, "id">) => void;
  disabled?: boolean;
  maxTags?: number;
}
