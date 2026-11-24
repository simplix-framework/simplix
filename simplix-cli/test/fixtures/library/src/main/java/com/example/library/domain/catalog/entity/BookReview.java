package com.example.library.domain.catalog.entity;

/**
 * What one reader wrote about a book, kept in the book's row.
 *
 * @param reader the reader's name
 * @param stars the rating, from one to five
 * @param comment the text of the review
 */
public record BookReview(String reader, int stars, String comment) {
}
