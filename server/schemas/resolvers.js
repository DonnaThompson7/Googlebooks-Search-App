const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (_, args, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
      console.log({context});
      const userData = await User.findById(context.user._id ).select("-__v -password");
      if (!userData) {
        throw new AuthenticationError('Cannot find a user with this id!');
      }
      return userData;
    },
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }
      // If there is a user found, check if the correct password was provided
      const correctPw = await user.isCorrectPassword(password);
      // If the password is incorrect, return an Authentication error stating so
      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }
      // If email and password are correct, sign user into the application with a JWT
      const token = signToken(user);

      // Return Auth object with signed token and user's information
      return { token, user };
    },

    addUser: async (_, { username, email, password }) => {
      // create the user
      const user = await User.create({ username, email, password });
      // sign a JSON Web Token and log the user in after they are created
      const token = signToken(user);
      // Return Auth object with signed token and user's information
      return { token, user };
    },

    saveBook: async (_, { book }, context) => {
      if (!context) {
        throw new AuthenticationError('Not logged in');
      }
      console.log({context});
      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $addToSet: { savedBooks: book } },
        { new: true }
      );
      return updatedUser;
    },

    removeBook: async (_, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId: bookId } } },
        { new: true }
      );
      return updatedUser;
    },
  },
};

module.exports = resolvers;
